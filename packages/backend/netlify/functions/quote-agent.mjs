// packages/backend/netlify/functions/quote-agent.mjs
// Self-contained YAML-driven quote agent - works locally and on Netlify

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import OpenAI from 'openai';

// Environment detection
const isNetlify = process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Get __dirname for both ESM and bundled environments
let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (error) {
  __dirname = process.cwd();
}

// Find YAML file (local vs Netlify paths)
let YAML_PATH;
if (isNetlify) {
  YAML_PATH = path.resolve(process.cwd(), 'agents/quote-agent.yaml');
} else {
  YAML_PATH = path.resolve(__dirname, '../../../../agents/quote-agent.yaml');
}

if (!fs.existsSync(YAML_PATH)) {
  YAML_PATH = path.resolve(__dirname, '../../../../../agents/quote-agent.yaml');
}

let yamlConfig;
try {
  yamlConfig = YAML.parse(fs.readFileSync(YAML_PATH, 'utf-8'));
  console.log('[QuoteAgent] Loaded YAML from:', YAML_PATH);
} catch (error) {
  console.error('[QuoteAgent] Failed to load YAML:', error.message);
  throw new Error(`Failed to load quote-agent.yaml: ${error.message}`);
}

const openAiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const REVIEW_STAGE = 'review_summary';
const START_NODE = 'emergency_check';

// In-memory session storage
const sessions = new Map();

// Helper functions
function getNodeById(nodeId) {
  return yamlConfig.nodes.find((node) => node.id === nodeId);
}

function normalizeServiceKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_$/g, '');
}

function createSession(sessionId) {
  const session = {
    id: sessionId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentNodeId: START_NODE,
    answers: [],
    nodeData: {},
    history: [],
    processedUserMessages: 0,
    summary: null,
  };

  sessions.set(sessionId, session);

  addAssistantMessage(
    session,
    "Hi there! I'm the AquaFlow quote assistant. I'll ask a few quick questions so we can prepare your plumbing quote."
  );

  askCurrentNode(session);
  return session;
}

function getSession(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required.');
  }

  const existing = sessions.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }
  return createSession(sessionId);
}

function addAssistantMessage(session, text, extra = {}) {
  session.history.push({ role: 'assistant', text, ...extra });
}

function addUserMessage(session, text) {
  session.history.push({ role: 'user', text });
}

function recordAnswer(session, nodeId, question, answer) {
  const node = getNodeById(nodeId);
  session.answers.push({
    nodeId,
    question,
    answer,
    captureKey: node?.capture || nodeId,
  });
}

function askCurrentNode(session) {
  const node = getNodeById(session.currentNodeId);

  if (!node) {
    console.error('[QuoteAgent] Node not found:', session.currentNodeId);
    buildSummary(session);
    return;
  }

  console.log('[QuoteAgent] Processing node:', node.id, 'type:', node.type);

  switch (node.type) {
    case 'choice':
      addAssistantMessage(session, node.prompt, {
        type: 'choice',
        options: (node.options || []).map((option) => ({
          label: option,
          value: option,
        })),
      });
      break;
    case 'static':
      addAssistantMessage(session, node.prompt, {
        type: 'input',
        inputType: 'text',
      });
      break;
    case 'switch':
      handleSwitchNode(session, node);
      break;
    default:
      console.warn('[QuoteAgent] Unknown node type:', node.type);
      buildSummary(session);
  }
}

function handleSwitchNode(session, node) {
  const variableValue = session.nodeData[node.variable];

  if (!variableValue) {
    console.error('[QuoteAgent] Switch variable not set:', node.variable);
    buildSummary(session);
    return;
  }

  const caseDefinition = node.cases?.[variableValue];

  if (!caseDefinition) {
    console.warn('[QuoteAgent] No case found for:', variableValue);
    buildSummary(session);
    return;
  }

  const questions = caseDefinition.prompt
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((line) => line.length > 0);

  if (questions.length === 0) {
    moveToNextNode(session, node);
    return;
  }

  const questionsKey = `${node.id}_questions`;
  const indexKey = `${node.id}_index`;

  if (!session.nodeData[questionsKey]) {
    session.nodeData[questionsKey] = questions;
    session.nodeData[indexKey] = 0;
  }

  const currentIndex = session.nodeData[indexKey];
  const currentQuestion = questions[currentIndex];

  if (currentQuestion) {
    addAssistantMessage(session, currentQuestion, {
      type: 'input',
      inputType: 'text',
    });
  } else {
    delete session.nodeData[questionsKey];
    delete session.nodeData[indexKey];
    moveToNextNode(session, node);
  }
}

function moveToNextNode(session, currentNode) {
  if (currentNode.next) {
    session.currentNodeId = currentNode.next;
    askCurrentNode(session);
  } else {
    checkForAiFollowUps(session);
  }
}

async function checkForAiFollowUps(session) {
  if (session.nodeData.followUpsGenerated) {
    buildSummary(session);
    return;
  }

  session.nodeData.followUpsGenerated = true;
  const followUps = await generateFollowUpQuestions(session);

  if (followUps.length > 0) {
    session.nodeData.followUpQuestions = followUps;
    session.nodeData.followUpIndex = 0;
    askNextFollowUpQuestion(session);
  } else {
    buildSummary(session);
  }
}

function askNextFollowUpQuestion(session) {
  const questions = session.nodeData.followUpQuestions || [];
  const index = session.nodeData.followUpIndex || 0;
  const question = questions[index];

  if (question) {
    addAssistantMessage(session, question, {
      type: 'input',
      inputType: 'text',
    });
  } else {
    buildSummary(session);
  }
}

async function generateFollowUpQuestions(session) {
  if (!openAiClient) return [];

  try {
    const conversationSummary = session.answers
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');

    const selectedService = session.nodeData.selected_service || 'General plumbing service';

    const prompt = `You are an expert plumbing quote agent.
You must determine if more information is required from the customer before submitting their request.

Service category: ${selectedService}
Answers collected so far:
${conversationSummary}

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
      return parsed.questions.filter((q) => typeof q === 'string' && q.trim().length > 0);
    }
    return [];
  } catch (error) {
    console.error('[QuoteAgent] Failed to generate follow-up questions:', error);
    return [];
  }
}

function buildSummary(session) {
  const emergencyAnswer = session.answers.find((a) => a.captureKey === 'is_emergency');
  const isEmergency = emergencyAnswer?.answer?.toLowerCase().startsWith('y') || false;

  const selectedService = session.nodeData.selected_service;
  const selectedServiceKey = selectedService ? normalizeServiceKey(selectedService) : 'other';

  const summary = {
    service: {
      label: selectedService || 'Plumbing Service',
      key: selectedServiceKey,
    },
    emergency: isEmergency,
    answers: session.answers.map((item) => ({
      question: item.question,
      answer: item.answer || 'Not provided',
    })),
  };

  session.summary = summary;
  session.currentNodeId = REVIEW_STAGE;

  const answerLines = summary.answers
    .map((item) => `• ${item.question}\n  ${item.answer}`)
    .join('\n');

  addAssistantMessage(
    session,
    `Here's a summary of what I collected:
- Service: ${summary.service.label}
- Emergency: ${summary.emergency ? 'Yes' : 'No'}

Your answers:
${answerLines}

Let's review your contact details, service location, and any attachments before we submit the quote.`,
    { type: 'summary' }
  );
}

async function handleUserInput(session, userText) {
  const currentNode = getNodeById(session.currentNodeId);

  if (!currentNode) {
    const followUpQuestions = session.nodeData.followUpQuestions || [];
    const followUpIndex = session.nodeData.followUpIndex || 0;

    if (followUpIndex < followUpQuestions.length) {
      const question = followUpQuestions[followUpIndex];
      recordAnswer(session, 'ai_followup', question, userText);
      session.nodeData.followUpIndex = followUpIndex + 1;
      askNextFollowUpQuestion(session);
      return;
    }

    if (session.currentNodeId === REVIEW_STAGE) {
      addAssistantMessage(
        session,
        'I already have all the details I need. Please review the summary and submit the request when ready.'
      );
    }
    return;
  }

  switch (currentNode.type) {
    case 'choice':
    case 'static':
      recordAnswer(session, currentNode.id, currentNode.prompt, userText);

      if (currentNode.capture) {
        session.nodeData[currentNode.capture] = userText;
      }

      moveToNextNode(session, currentNode);
      break;

    case 'switch':
      const questionsKey = `${currentNode.id}_questions`;
      const indexKey = `${currentNode.id}_index`;
      const questions = session.nodeData[questionsKey] || [];
      const currentIndex = session.nodeData[indexKey] || 0;
      const currentQuestion = questions[currentIndex];

      if (currentQuestion) {
        recordAnswer(session, currentNode.id, currentQuestion, userText);
        session.nodeData[indexKey] = currentIndex + 1;
        handleSwitchNode(session, currentNode);
      }
      break;

    default:
      console.warn('[QuoteAgent] Unhandled node type:', currentNode.type);
      buildSummary(session);
  }
}

function extractUserMessages(messages = []) {
  return messages.filter((message) => message?.role === 'user');
}

async function runQuoteAgent({ sessionId, messages = [] }) {
  console.log('[QuoteAgent] Called with:', { sessionId, messagesCount: messages.length });

  const session = getSession(sessionId);
  const userMessages = extractUserMessages(messages);

  while (session.processedUserMessages < userMessages.length) {
    const message = userMessages[session.processedUserMessages];
    const content =
      typeof message.text === 'string'
        ? message.text
        : typeof message.content === 'string'
        ? message.content
        : Array.isArray(message.content)
        ? message.content.map((chunk) => chunk?.text || chunk).join(' ')
        : '';

    if (content && content.trim().length > 0) {
      addUserMessage(session, content.trim());
      await handleUserInput(session, content.trim());
    }

    session.processedUserMessages += 1;
  }

  const responseStage = session.currentNodeId === REVIEW_STAGE ? REVIEW_STAGE : 'chat';

  return {
    messages: session.history.map((item) => ({
      role: item.role,
      text: item.text,
      type: item.type,
      inputType: item.inputType,
      options: item.options,
    })),
    stage: responseStage,
    summary: session.currentNodeId === REVIEW_STAGE ? session.summary : null,
    currentNode: session.currentNodeId,
    completedNodes: [],
  };
}

// Netlify function handler
export async function handler(event, context) {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: ''
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { messages, context: agentContext } = body;
    const sessionId = agentContext?.sessionId || agentContext?.userId || agentContext?.conversationId;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'sessionId is required to run the quote agent.' }),
      };
    }

    const result = await runQuoteAgent({
      sessionId,
      messages: messages || [],
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('[QuoteAgent] Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Agent execution failed',
        details: error.message
      })
    };
  }
}
