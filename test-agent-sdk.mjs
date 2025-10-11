#!/usr/bin/env node

/**
 * Local Agent Testing Script using OpenAI Agents SDK
 * Tests the QuoteAgent logic by simulating the YAML workflow
 */

import { Agent, run } from "@openai/agents";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service definitions (simplified version)
const serviceDefinitions = {
  services: [
    {
      key: 'leak_repair',
      title: 'Leak Repair',
      questions: [
        'What type of leak is it?',
        'Where is the leak located?',
        'How severe is the water flow?'
      ]
    }
  ],
  genericQuestions: [
    { key: 'problem_description', question: 'Describe the problem' },
    { key: 'is_emergency', question: 'Is this an emergency?' }
  ]
};

// Simulate static questions flow
function getStaticQuestions(category) {
  const service = serviceDefinitions.services.find(s => s.key === category);
  if (!service) return [];

  return [
    ...serviceDefinitions.genericQuestions.map(q => q.question),
    ...service.questions
  ];
}

// Create agent with instructions based on YAML
const agent = new Agent({
  name: "QuoteAgent",
  instructions: `
You are a plumbing quote assistant. Follow this workflow:

1. Ask static questions first from the service definitions
2. If answers are incomplete, ask clarifying questions
3. Use tools for specialized assessments
4. Keep responses focused on plumbing services

Available tools:
- assess_leak_severity: Assess leak severity based on description
- check_emergency_status: Determine if situation qualifies as emergency
- analyze_water_heater_issue: Analyze water heater problems

Always be conversational and helpful.
  `,
  // Tools temporarily removed for testing basic conversation
  // tools: [...]
});

async function testAgent() {
  console.log("🤖 Starting QuoteAgent Local Test");
  console.log("==================================");

  try {
    // Test conversation
    const testMessages = [
      "I need a quote for fixing a leaking pipe",
      "It's under my kitchen sink, dripping steadily",
      "Yes, it's an emergency"
    ];

    for (const message of testMessages) {
      console.log(`\n👤 User: ${message}`);

      const result = await run(agent, message);
      console.log(`🤖 Agent: ${result.finalOutput}`);

      // Show tool calls if any
      if (result.toolCalls && result.toolCalls.length > 0) {
        console.log("🔧 Tools used:");
        result.toolCalls.forEach(call => {
          console.log(`  - ${call.name}: ${JSON.stringify(call.result, null, 2)}`);
        });
      }
    }

    console.log("\n✅ Test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testAgent();