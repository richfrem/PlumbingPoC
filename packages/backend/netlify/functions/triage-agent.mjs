// packages/backend/netlify/functions/triage-agent.mjs
// Self-contained YAML-driven triage agent - works locally and on Netlify

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
  console.log('[TriageAgent] Loaded YAML from:', YAML_PATH);
} catch (error) {
  console.error('[TriageAgent] Failed to load YAML:', error.message);
  throw new Error(`Failed to load triage-agent.yaml: ${error.message}`);
}

const openAiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Calculate job complexity based on service category and details
 */
function calculateJobComplexity(serviceCategory, problemDescription, locationDetails) {
  const complexityMap = {
    'leak_repair': 6,
    'water_heater': 7,
    'pipe_installation': 8,
    'drain_cleaning': 4,
    'fixture_install': 3,
    'gas_line_services': 9,
    'perimeter_drains': 7,
    'main_line_repair': 9,
    'emergency_service': 8,
    'bathroom_reno': 8,
    'other': 5
  };

  const baseComplexity = complexityMap[serviceCategory] || 5;

  // Adjust based on location difficulty
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

  // Boost urgency for severe problems
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

  console.log('[TriageAgent] Starting triage analysis for request:', requestData.id);

  // Extract key information from request
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

  // Calculate preliminary scores using tools
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

  // Format answers for AI analysis
  const formattedAnswers = formatAnswersForAnalysis(answers);

  // Find the analyze_request node from YAML config
  const analyzeNode = yamlConfig.nodes.find(node => node.id === 'analyze_request');
  if (!analyzeNode) {
    throw new Error('analyze_request node not found in triage-agent.yaml');
  }

  // Build the prompt with actual data
  const systemPrompt = `You are an expert plumbing business analyst. Analyze this customer request and provide a detailed triage assessment in JSON format.

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

Based on all this information, provide a JSON response with:
1. A concise triage summary (2-3 sentences) explaining what the customer needs
2. Priority score (1-10) considering urgency, complexity, and business impact
3. Priority explanation (why this score?)
4. Profitability score (1-10) based on job type, complexity, and potential for additional services
5. Profitability explanation (why this score?)

Consider:
- Urgency of the problem
- Technical complexity of the job
- Potential for upselling or additional services
- Customer's timeline and flexibility
- Emergency status and its impact on scheduling
- Property type and accessibility challenges

Return your analysis as a JSON object.`;

  try {
    const response = await openAiClient.chat.completions.create({
      model: analyzeNode.model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Please analyze this plumbing service request and provide the triage assessment.'
        }
      ],
      response_format: { type: 'json_object' },
      functions: [{
        name: 'provide_triage_assessment',
        description: 'Provide a structured triage assessment for a plumbing service request',
        parameters: {
          type: 'object',
          properties: {
            triage_summary: {
              type: 'string',
              description: 'Concise summary of the request (2-3 sentences)'
            },
            priority_score: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              description: 'Priority score from 1-10'
            },
            priority_explanation: {
              type: 'string',
              description: 'Explanation of the priority score'
            },
            profitability_score: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              description: 'Profitability score from 1-10'
            },
            profitability_explanation: {
              type: 'string',
              description: 'Explanation of the profitability score'
            }
          },
          required: ['triage_summary', 'priority_score', 'priority_explanation', 'profitability_score', 'profitability_explanation']
        }
      }],
      function_call: { name: 'provide_triage_assessment' }
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error('No function call response from OpenAI');
    }

    const analysis = JSON.parse(functionCall.arguments);

    console.log('[TriageAgent] Analysis completed:', {
      priority: analysis.priority_score,
      profitability: analysis.profitability_score
    });

    return {
      triage_summary: analysis.triage_summary,
      priority_score: analysis.priority_score,
      priority_explanation: analysis.priority_explanation,
      profitability_score: analysis.profitability_score,
      profitability_explanation: analysis.profitability_explanation,
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
  // Handle CORS preflight
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    
    console.log('[TriageAgent] Received triage request for:', requestData.id);

    // Run the AI analysis
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
