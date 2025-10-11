// packages/backend/api/agents/quoteAgentRunner.js
// Local runner for QuoteAgent workflow using YAML definition as source of truth.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YAML_PATH = path.resolve(__dirname, '../../../../agents/quote-agent.yaml');
const yamlConfig = YAML.parse(fs.readFileSync(YAML_PATH, 'utf-8'));

const openAiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const REVIEW_STAGE = 'review_summary';

function normalizeServiceKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractGenericQuestions() {
  // Map YAML node IDs to question configurations
  const nodeMappings = {
    emergency_check: {
      key: 'is_emergency',
      question: 'Is this an emergency request?',
      options: ['Yes', 'No'],
    },
    type_of_property: {
      key: 'property_type',
      question: 'What type of property is this service for?',
      options: ['Residential', 'Apartment', 'Commercial', 'Other'],
    },
    do_you_own: {
      key: 'is_homeowner',
      question: 'Do you own this property?',
      options: ['Yes', 'No'],
    },
    when_schedule: {
      key: 'preferred_timing',
      question: 'When would you like this service to be scheduled?',
      options: null,
    },
  };

  const questions = [];

  // Extract questions from YAML nodes in the correct order
  Object.keys(nodeMappings).forEach(nodeId => {
    const node = yamlConfig.nodes.find((item) => item.id === nodeId);
    if (node) {
      const mapping = nodeMappings[nodeId];
      questions.push({
        key: mapping.key,
        question: node.prompt || mapping.question,
        options: node.options || mapping.options,
      });
    }
  });

  return questions;
}

function extractServicePrompts() {
  const node = yamlConfig.nodes.find((item) => item.id === 'service_questions');
  if (!node) return new Map();

  const cases = node.cases ?? {};
  const result = new Map();

  Object.entries(cases).forEach(([label, caseDefinition]) => {
    if (!caseDefinition?.prompt) return;
    const lines = caseDefinition.prompt
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((line) => line.length > 0);

    result.set(label, lines);
  });

  return result;
}

const GENERIC_QUESTIONS = extractGenericQuestions();
const SERVICE_PROMPTS = extractServicePrompts();
const SERVICE_OPTIONS = Array.from(SERVICE_PROMPTS.keys());

function getServiceQuestions(serviceLabel) {
  return SERVICE_PROMPTS.get(serviceLabel) ?? [];
}

const sessions = new Map();

function createSession(sessionId, context = {}) {
  const session = {
    id: sessionId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stage: 'emergency_check', // Start with first YAML node
    genericIndex: 0,
    serviceIndex: 0,
    followUpIndex: 0,
    followUpQuestions: [],
    followUpsGenerated: false,
    answers: [],
    followUpAnswers: [],
    selectedServiceLabel: null,
    selectedServiceKey: null,
    isEmergency: null,
    history: [],
    processedUserMessages: 0,
    preselectedService: context.preselectedService ?? null,
    summary: null,
  };

  sessions.set(sessionId, session);

  addAssistantMessage(
    session,
    "Hi there! I'm the AquaFlow quote assistant. I’ll ask a few quick questions so we can prepare your plumbing quote."
  );

  // Start with the first question from YAML
  askCurrentGenericQuestion(session);

  return session;
}

function getSession(sessionId, context = {}) {
  if (!sessionId) {
    throw new Error('Session ID is required to run the quote agent.');
  }

  const existing = sessions.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    if (context.preselectedService && !existing.selectedServiceLabel) {
      existing.preselectedService = context.preselectedService;
    }
    return existing;
  }
  return createSession(sessionId, context);
}

function addAssistantMessage(session, text, extra = {}) {
  session.history.push({ role: 'assistant', text, ...extra });
}

function addUserMessage(session, text) {
  session.history.push({ role: 'user', text });
}


function askCurrentGenericQuestion(session) {
  const item = GENERIC_QUESTIONS[session.genericIndex];
  if (item) {
    // Use the options from the extracted questions (which come from YAML)
    if (Array.isArray(item.options) && item.options.length > 0) {
      addAssistantMessage(session, item.question, {
        type: 'choice',
        options: item.options.map((option) => ({
          label: option,
          value: option,
        })),
      });
    } else {
      addAssistantMessage(session, item.question, {
        type: 'input',
        inputType: 'text',
      });
    }
  } else {
    session.stage = 'select_service';
    sendServiceOptions(session);
  }
}

function sendServiceOptions(session) {
  addAssistantMessage(
    session,
    'What type of plumbing service do you need?',
    {
      type: 'choice',
      options: SERVICE_OPTIONS.map((option) => ({
        label: option,
        value: option,
      })),
    }
  );
}

function askNextServiceQuestion(session) {
  const questions = getServiceQuestions(session.selectedServiceLabel);
  const question = questions[session.serviceIndex];
  if (question) {
    console.log('[QuoteAgentRunner] Asking service question', {
      service: session.selectedServiceLabel,
      index: session.serviceIndex,
      question,
    });
    addAssistantMessage(session, question, {
      type: 'input',
      inputType: 'text',
    });
  }
}

function askNextFollowUpQuestion(session) {
  const question = session.followUpQuestions[session.followUpIndex];
  if (question) {
    addAssistantMessage(session, question, {
      type: 'input',
      inputType: 'text',
    });
  }
}

function recordAnswer(session, question, answer) {
  session.answers.push({ question, answer });
}

function slugServiceLabel(label) {
  return normalizeServiceKey(label);
}

async function generateFollowUpQuestions(session) {
  if (!openAiClient) return [];

  try {
    const lines = session.answers
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');

    const service = session.selectedServiceLabel ?? 'General plumbing service';
    const prompt = `You are an expert plumbing quote agent.
You must determine if more information is required from the customer before submitting their request.

Service category: ${service}
Answers collected so far:
${lines}

If more details are needed to prepare an accurate quote, ask up to 3 follow-up questions.
If everything is clear, return an empty list.

Respond in JSON:
{ "requiresFollowUp": boolean, "questions": ["question 1", ...] }`;

    const completion = await openAiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You craft follow-up questions for plumbing quotes.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 250,
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    if (parsed?.requiresFollowUp && Array.isArray(parsed.questions)) {
      return parsed.questions.filter((question) => typeof question === 'string' && question.trim().length > 0);
    }
    return [];
  } catch (error) {
    console.error('QuoteAgentRunner: Failed to generate follow-up questions', error);
    return [];
  }
}

function buildSummary(session) {
  const summary = {
    service: {
      label: session.selectedServiceLabel,
      key: session.selectedServiceKey,
    },
    emergency: session.isEmergency ?? false,
    answers: [...session.answers, ...session.followUpAnswers],
  };

  session.summary = summary;
  session.stage = REVIEW_STAGE;

  const answerLines = summary.answers
    .map((item) => `• ${item.question}\n  ${item.answer || 'Not provided'}`)
    .join('\n');

  addAssistantMessage(
    session,
    `Here’s a summary of what I collected:
- Service: ${summary.service.label ?? 'Not selected'}
- Emergency: ${summary.emergency ? 'Yes' : 'No'}

Your answers:
${answerLines}

Let’s review your contact details, service location, and any attachments before we submit the quote.`
  ,
    { type: 'summary' }
  );
}

async function handleGenericAnswer(session, answer) {
  const questionItem = GENERIC_QUESTIONS[session.genericIndex];
  if (questionItem) {
    recordAnswer(session, questionItem.question, answer);

    // Special handling for emergency question (first question)
    if (questionItem.key === 'is_emergency') {
      const normalized = (answer || '').trim().toLowerCase();
      session.isEmergency = normalized.startsWith('y') || normalized === 'yes';
    }
  }

  session.genericIndex += 1;

  if (session.genericIndex < GENERIC_QUESTIONS.length) {
    askCurrentGenericQuestion(session);
    return;
  }

  session.stage = 'select_service';

  if (session.preselectedService) {
    const matched = SERVICE_OPTIONS.find(
      (option) => slugServiceLabel(option) === normalizeServiceKey(session.preselectedService)
    );
    if (matched) {
      session.selectedServiceLabel = matched;
      session.selectedServiceKey = slugServiceLabel(matched);
      recordAnswer(session, 'Selected service category', matched);
      session.stage = 'service_questions';
      askNextServiceQuestion(session);
      return;
    }
  }

  sendServiceOptions(session);
}

async function handleServiceSelection(session, answer) {
  if (!answer) {
    sendServiceOptions(session);
    return;
  }

  const normalizedAnswer = answer.toLowerCase();
  let matched = SERVICE_OPTIONS.find((option) => option.toLowerCase() === normalizedAnswer);

  if (!matched) {
    matched = SERVICE_OPTIONS.find((option) =>
      slugServiceLabel(option) === normalizeServiceKey(answer)
    );
  }

  if (!matched) {
    addAssistantMessage(
      session,
      "I didn’t quite catch that service type. Please choose one of the listed options (for example, \"Leak Detection & Repair\")."
    );
    return;
  }

  session.selectedServiceLabel = matched;
  session.selectedServiceKey = slugServiceLabel(matched);
  recordAnswer(session, 'Selected service category', matched);
  session.stage = 'service_questions';
  askNextServiceQuestion(session);
}

async function handleServiceAnswer(session, answer) {
  const question = getServiceQuestions(session.selectedServiceLabel)[session.serviceIndex];
  if (question) {
    recordAnswer(session, question, answer || 'Not provided');
  }

  session.serviceIndex += 1;

  const questions = getServiceQuestions(session.selectedServiceLabel);
  if (session.serviceIndex < questions.length) {
    askNextServiceQuestion(session);
    return;
  }

  if (!session.followUpsGenerated) {
    session.followUpsGenerated = true;
    const followUps = await generateFollowUpQuestions(session);
    if (followUps.length > 0) {
      session.followUpQuestions = followUps;
      session.stage = 'ai_followup';
      session.followUpIndex = 0;
      askNextFollowUpQuestion(session);
      return;
    }
  }

  buildSummary(session);
}

async function handleFollowUpAnswer(session, answer) {
  const question = session.followUpQuestions[session.followUpIndex];
  if (question) {
    session.followUpAnswers.push({ question, answer: answer || 'Not provided' });
  }

  session.followUpIndex += 1;

  if (session.followUpIndex < session.followUpQuestions.length) {
    askNextFollowUpQuestion(session);
    return;
  }

  buildSummary(session);
}

async function handleUserInput(session, userText) {
  switch (session.stage) {
    case 'emergency_check':
    case 'generic_questions':
      console.log('[QuoteAgentRunner] Generic answer:', {
        stage: session.stage,
        index: session.genericIndex,
        question: GENERIC_QUESTIONS[session.genericIndex]?.question,
        answer: userText,
      });
      await handleGenericAnswer(session, userText);
      break;
    case 'select_service':
      console.log('[QuoteAgentRunner] Service selection:', userText);
      await handleServiceSelection(session, userText);
      break;
    case 'service_questions':
      await handleServiceAnswer(session, userText);
      break;
    case 'ai_followup':
      await handleFollowUpAnswer(session, userText);
      break;
    case REVIEW_STAGE:
      addAssistantMessage(session, 'I already have all the details I need. Please review the summary and submit the request when ready.');
      break;
    default:
      addAssistantMessage(session, 'Thanks! I’ll keep your answer noted.');
      break;
  }
}


function extractUserMessages(messages = []) {
  return messages.filter((message) => message?.role === 'user');
}

export async function runQuoteAgent({ sessionId, messages = [], context = {} }) {
  console.log('[runQuoteAgent] Called with:', { sessionId, messagesCount: messages.length, context });

  const session = getSession(sessionId, context);
  console.log('[runQuoteAgent] Session state:', {
    stage: session.stage,
    genericIndex: session.genericIndex,
    processedUserMessages: session.processedUserMessages,
    historyLength: session.history.length
  });

  const userMessages = extractUserMessages(messages);
  console.log('[runQuoteAgent] User messages to process:', userMessages.length);

  while (session.processedUserMessages < userMessages.length) {
    const message = userMessages[session.processedUserMessages];
    const content = typeof message.text === 'string'
      ? message.text
      : typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
      ? message.content.map((chunk) => chunk?.text || chunk).join(' ')
      : '';

    console.log('[runQuoteAgent] Processing user message:', {
      index: session.processedUserMessages,
      content: content.trim(),
      hasContent: !!(content && content.trim().length > 0)
    });

    if (content && content.trim().length > 0) {
      addUserMessage(session, content.trim());
      console.log('[runQuoteAgent] Added user message, calling handleUserInput');
      await handleUserInput(session, content.trim());
      console.log('[runQuoteAgent] handleUserInput completed');
    }

    session.processedUserMessages += 1;
  }

  console.log('[runQuoteAgent] Final session state:', {
    stage: session.stage,
    genericIndex: session.genericIndex,
    processedUserMessages: session.processedUserMessages,
    historyLength: session.history.length
  });

  const responseStage = session.stage === REVIEW_STAGE ? REVIEW_STAGE : 'chat';

  console.log('[QuoteAgentRunner] Response stage:', {
    sessionStage: session.stage,
    responseStage,
    lastMessage: session.history[session.history.length - 1],
  });

  return {
    messages: session.history.map((item) => ({
      role: item.role,
      text: item.text,
      type: item.type,
      inputType: item.inputType,
      options: item.options,
    })),
    stage: responseStage,
    summary: session.stage === REVIEW_STAGE ? session.summary : null,
    currentNode: session.stage,
    completedNodes: [],
  };
}

export function resetQuoteAgentSession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

export function clearStaleSessions(maxAgeMs = 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.updatedAt < cutoff) {
      sessions.delete(sessionId);
    }
  }
}
