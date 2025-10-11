// test-agent.mjs - Simple test script for OpenAI Agents SDK
import { Agent, run } from '@openai/agents';
import OpenAI from 'openai';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a simple test agent
const testAgent = new Agent({
  name: 'Plumbing Assistant',
  instructions: 'You are a helpful plumbing assistant. Ask questions to gather information about plumbing issues.',
  model: 'gpt-4o-mini',
  tools: [
    {
      name: 'assess_leak_severity',
      description: 'Assess the severity of a leak based on description',
      parameters: {
        type: 'object',
        properties: {
          leak_description: { type: 'string' },
          drip_rate: { type: 'string' }
        },
        required: ['leak_description']
      },
      execute: async (input) => {
        const severity = input.drip_rate?.includes('steady stream') ? 'high' :
                       input.drip_rate?.includes('drip') ? 'medium' : 'low';
        return {
          severity,
          urgency: severity === 'high' ? 'immediate' : severity === 'medium' ? 'within 24 hours' : 'schedule soon',
          estimated_cost_range: severity === 'high' ? '$200-500' : severity === 'medium' ? '$100-300' : '$50-150'
        };
      }
    }
  ]
});

// Test the agent
async function runTest() {
  try {
    console.log('Testing OpenAI Agent...');

    const result = await run(testAgent, 'I have a leak under my kitchen sink. Water is dripping steadily.');

    console.log('Agent Response:', result.finalOutput);
    console.log('Tool Calls:', result.toolCalls);
  } catch (error) {
    console.error('Agent test failed:', error);
  }
}

runTest();