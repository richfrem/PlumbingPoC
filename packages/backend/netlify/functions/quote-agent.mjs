// packages/backend/netlify/functions/quote-agent.mjs
// Netlify function to run QuoteAgent using OpenAI Agents SDK

import { runQuoteAgent } from "../../api/agents/quoteAgentRunner.js";

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
      context: agentContext || {},
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        ...result
      })
    };

  } catch (error) {
    console.error('QuoteAgent function error:', error);
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
