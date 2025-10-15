// packages/backend/netlify/functions/triage-agent.mjs
// Self-contained YAML-driven triage agent - works locally and on Netlify

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import OpenAI from 'openai';
import { logger } from '../../src/lib/logger.js';
import dotenv from "dotenv";
dotenv.config();

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
  YAML_PATH = path.resolve(process.cwd(), 'agents/triage-agent.yaml');
} else {
  YAML_PATH = path.resolve(__dirname, '../../../../agents/triage-agent.yaml');
}

if (!fs.existsSync(YAML_PATH)) {
  YAML_PATH = path.resolve(__dirname, '../../../../../agents/triage-agent.yaml');
}

let yamlConfig;
try {
  yamlConfig = YAML.parse(fs.readFileSync(YAML_PATH, 'utf-8'));
  logger.log('[TriageAgent] Loaded YAML from:', YAML_PATH);
} catch (error) {
  console.error('[TriageAgent] Failed to load YAML:', error.message);
  throw new Error(`Failed to load triage-agent.yaml: ${error.message}`);
}

// Substitute environment variables in YAML config
function substituteEnvVars(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(substituteEnvVars);
  } else if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVars(value);
    }
    return result;
  }
  return obj;
}

yamlConfig = substituteEnvVars(yamlConfig);

const openAiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Calculate job complexity based on service category and details
 */
function calculateJobComplexity(serviceCategory, problemDescription, locationDetails) {
  const complexityMap = {
    'leak_repair': 5,
    'water_heater': 7,
    'pipe_installation': 7,
    'drain_cleaning': 3,
    'fixture_install': 3,
    'gas_line_services': 10,
    'perimeter_drains': 8,
    'main_line_repair': 10,
    'emergency_service': 8,
    'bathroom_reno': 9,
    'other': 5
  };

  const baseComplexity = complexityMap[serviceCategory] || 5;

  let locationMultiplier = 1;
  const location = (locationDetails || '').toLowerCase();
  if (location.includes('basement') || location.includes('crawlspace')) {
    locationMultiplier = 1.2;
  } else if (location.includes('attic') || location.includes('under house')) {
    locationMultiplier = 1.3;
  }

  return Math.min(10, Math.round(baseComplexity * locationMultiplier));
}

/**
 * Assess customer urgency based on emergency flag and timeline
 */
function assessCustomerUrgency(isEmergency, timelineRequested, problemSeverity) {
  if (isEmergency) return 10;

  const urgencyMap = {
    'today': 9,
    'tomorrow': 8,
    'this week': 7,
    'next week': 5,
    'asap': 8,
    'soon': 6,
    'flexible': 3
  };

  const timeline = (timelineRequested || '').toLowerCase();
  const timelineUrgency = urgencyMap[timeline] || 4;

  let severityBoost = 0;
  const severity = (problemSeverity || '').toLowerCase();
  if (severity.includes('flooding') || severity.includes('no water') || severity.includes('burst')) {
    severityBoost = 2;
  }

  return Math.min(10, timelineUrgency + severityBoost);
}

/**
 * Format Q&A data for AI analysis
 */
function formatAnswersForAnalysis(answers) {
  if (!Array.isArray(answers)) return 'No answers provided';
  return answers
    .map((qa, index) => `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}`)
    .join('\n\n');
}

/**
 * Run triage analysis on a request
 */
async function runTriageAnalysis(requestData) {
  if (!openAiClient) {
    throw new Error('OpenAI API key not configured');
  }

  logger.log('[TriageAgent] Starting triage analysis for request:', requestData.id);

  const {
    problem_category,
    is_emergency,
    answers,
    problem_description,
    service_address,
    preferred_timing,
    property_type,
    additional_notes
  } = requestData;

  const complexityScore = calculateJobComplexity(
    problem_category,
    problem_description,
    additional_notes
  );

  const urgencyScore = assessCustomerUrgency(
    is_emergency,
    preferred_timing,
    problem_description
  );

  const formattedAnswers = formatAnswersForAnalysis(answers);

  const analyzeNode = yamlConfig.nodes.find(node => node.id === 'analyze_request');
  if (!analyzeNode) {
    throw new Error('analyze_request node not found in triage-agent.yaml');
  }

  const systemPrompt = `${analyzeNode.prompt}

**Request Details:**
- Service Category: ${problem_category}
- Emergency Status: ${is_emergency ? 'YES - EMERGENCY' : 'No'}
- Property Type: ${property_type || 'Not specified'}
- Preferred Timing: ${preferred_timing || 'Not specified'}
- Service Address: ${service_address || 'Not specified'}

**Problem Description:**
${problem_description || 'Not provided'}

**Customer Answers to Questions:**
${formattedAnswers}

**Additional Notes:**
${additional_notes || 'None'}

**Preliminary Scores:**
- Calculated Complexity: ${complexityScore}/10
- Calculated Urgency: ${urgencyScore}/10

Return your analysis as a JSON object matching the specified output schema.`;

  try {
    const model = analyzeNode.model;
    console.log('[LOG] [TriageAgent] Using AI model:', model);

    const isGpt5Model = model?.startsWith('gpt-5');
    const isGpt4oModel = model?.startsWith('gpt-4o');
    
    let response;
    let maxTokens = 2000;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      if (isGpt5Model) {
        const responseParams = {
          model: model,
          input: `${systemPrompt}\n\nPlease analyze this plumbing service request and provide the triage assessment.`,
          reasoning: { effort: "medium" },
          text: { verbosity: "medium" },
          max_output_tokens: maxTokens,
          tools: [{
            type: "function",
            name: "provide_triage_assessment",
            description: "Provide a structured triage assessment for a plumbing service request",
            parameters: analyzeNode.output
          }],
          tool_choice: { type: "function", name: "provide_triage_assessment" }
        };
        
        response = await openAiClient.responses.create(responseParams);
      } else {
        const apiParams = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Please analyze this plumbing service request and provide the triage assessment.' }
          ],
          response_format: { type: 'json_object' },
          tools: [{
            type: 'function',
            function: {
              name: 'provide_triage_assessment',
              description: 'Provide a structured triage assessment for a plumbing service request',
              parameters: analyzeNode.output
            }
          }],
          tool_choice: { type: 'function', function: { name: 'provide_triage_assessment' } }
        };
        
        if (isGpt4oModel) {
          apiParams.max_completion_tokens = maxTokens;
        } else {
          apiParams.max_tokens = maxTokens;
        }
        
        response = await openAiClient.chat.completions.create(apiParams);
      }

      // Check if response is complete for GPT-5 models
      if (isGpt5Model && response.status === 'incomplete' && response.incomplete_details?.reason === 'max_output_tokens' && retryCount < maxRetries) {
        logger.log(`[TriageAgent] Response incomplete due to max_output_tokens, retrying with higher limit. Attempt ${retryCount + 1}/${maxRetries}`);
        maxTokens = Math.min(maxTokens * 2, 8000); // Double tokens, max 8000
        retryCount++;
        continue;
      }

      break; // Exit loop if response is complete or not retrying
    }

    // 🔹 NEW: Hardened parsing logic
    let analysis;
    if (isGpt5Model) {
      const toolCall = response.output?.find(o => o.type === "function_call");
      if (toolCall?.arguments) {
        try {
          analysis = JSON.parse(toolCall.arguments);
        } catch (err) {
          logger.error("[TriageAgent] Failed to parse function_call arguments JSON:", err.message);
        }
      }

      if (!analysis && response.output_text) {
        try {
          analysis = JSON.parse(response.output_text);
          logger.log("[TriageAgent] Fallback: parsed JSON from output_text");
        } catch (err) {
          logger.error("[TriageAgent] Failed to parse output_text JSON:", err.message);
        }
      }
    } else {
      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          analysis = JSON.parse(toolCall.function.arguments);
        } catch (err) {
          logger.error("[TriageAgent] Failed to parse tool_call arguments JSON:", err.message);
        }
      }
    }

    logger.log("[DEBUG] OpenAI raw response:", JSON.stringify(response, null, 2));

    if (!analysis) {
      // Fallback: generate basic analysis from preliminary scores
      logger.log("[TriageAgent] No parsable analysis from AI, using fallback based on preliminary scores");
      analysis = {
        triage_summary: `Basic triage assessment based on preliminary analysis. Service category: ${problem_category}. Emergency: ${is_emergency ? 'Yes' : 'No'}.`,
        priority_score: Math.min(10, Math.max(1, Math.round((complexityScore + urgencyScore) / 2))),
        priority_explanation: `Priority based on complexity (${complexityScore}/10) and urgency (${urgencyScore}/10) scores.`,
        profitability_score: Math.min(10, Math.max(1, Math.round(complexityScore * 0.8))), // Assume profitability correlates with complexity
        profitability_explanation: `Profitability estimated based on job complexity (${complexityScore}/10).`,
        required_expertise: {
          skill_level: complexityScore >= 8 ? 'master' : complexityScore >= 6 ? 'journeyman' : 'apprentice',
          specialized_skills: [problem_category.replace('_', ' ')],
          reasoning: `Skill level determined by job complexity score of ${complexityScore}/10.`
        }
      };
    }

    logger.log('[TriageAgent] Analysis completed:', {
      priority: analysis.priority_score,
      profitability: analysis.profitability_score,
      expertise: analysis.required_expertise?.skill_level
    });

    return {
      triage_summary: analysis.triage_summary,
      priority_score: analysis.priority_score,
      priority_explanation: analysis.priority_explanation,
      profitability_score: analysis.profitability_score,
      profitability_explanation: analysis.profitability_explanation,
      required_expertise: analysis.required_expertise,
      complexity_score: complexityScore,
      urgency_score: urgencyScore
    };

  } catch (error) {
    console.error('[TriageAgent] Error during analysis:', error);
    throw error;
  }
}

// Netlify function handler
export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

  try {
    const requestData = JSON.parse(event.body);
    logger.log('[TriageAgent] Received triage request for:', requestData.id);

    const analysis = await runTriageAnalysis(requestData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(analysis)
    };

  } catch (error) {
    console.error('[TriageAgent] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Triage analysis failed',
        message: error.message
      })
    };
  }
}
