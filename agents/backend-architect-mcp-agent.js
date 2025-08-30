/**
 * =====================================================================================
 * AGENT NAME: Backend Architect MCP Agent
 * FILE:       agents/backend-architect-mcp-agent.js
 * =====================================================================================
 *
 * @description
 * This script acts as an autonomous Backend Architect agent. It reviews the project's
 * database schema and API routes, identifies a potential improvement, and generates
 * a structured feedback file with a specific, actionable code change. It is guided
 * by a manifest of valid files to prevent hallucinations.
 *
 * @usage
 * This script is intended to be run from inside the 'agents/' directory.
 *
 * COMMAND:
 * node backend-architect-mcp-agent.js review-backend
 *
 * =====================================================================================
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { editableFileManifest } = require('./projectFileManifest.ts'); // <-- IMPORT THE MANIFEST

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ======================================================
 * FUNCTION: reviewBackend
 * PURPOSE:  Loads persona and backend files, sends them to Gemini for an
 *           expert review, and generates a JSON feedback file with a proposed change.
 * ======================================================
 */
async function reviewBackend() {
  console.log('============================================');
  console.log('🚀 STARTING BACKEND ARCHITECTURE REVIEW');
  console.log('============================================');

  try {
    const projectRoot = path.resolve(__dirname, '..');
    const dbSchemaPath = path.join(projectRoot, 'SUPABASE_TABLES.sql');
    const apiRoutesDir = path.join(projectRoot, 'vite-app', 'api', 'routes');

    if (!fs.existsSync(dbSchemaPath) || !fs.existsSync(apiRoutesDir)) {
      console.error(`Error: Could not find required backend files.`);
      console.error(`Checked for: ${dbSchemaPath}`);
      console.error(`Checked for: ${apiRoutesDir}`);
      return;
    }

    const dbSchemaContent = fs.readFileSync(dbSchemaPath, 'utf8');
    
    const routeFiles = fs.readdirSync(apiRoutesDir).filter(f => f.endsWith('.js'));
    let apiRoutesContent = '';
    for (const file of routeFiles) {
      const content = fs.readFileSync(path.join(apiRoutesDir, file), 'utf8');
      apiRoutesContent += `\n\n--- START OF FILE ${file} ---\n\n${content}\n\n--- END OF FILE ${file} ---`;
    }
    
    console.log('✅ Successfully loaded database schema and API routes.');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    console.log('Successfully initialized Gemini 2.5 Pro model.');
    
    const personaFilePath = path.join(__dirname, 'backend-architect-mcp.md');
    const personaContent = fs.readFileSync(personaFilePath, 'utf8');
    console.log('Successfully loaded Backend Architect persona.');

    const prompt = `
      ${personaContent}

      ---------------------------
      CONTEXT: VALID FILE PATHS
      ---------------------------
      Here is a complete list of all the files you are allowed to modify. You MUST choose a file path from this list.
      \`\`\`json
      ${JSON.stringify(editableFileManifest, null, 2)}
      \`\`\`

      ---------------------------
      YOUR CURRENT TASK
      ---------------------------
      As the Backend Architect, you are to review the provided database schema and API routes. Your goal is to identify one specific, high-impact improvement related to scalability, security, or best practices and propose a single-line code change to implement it.

      **Database Schema (SUPABASE_TABLES.sql):**
      \`\`\`sql
      ${dbSchemaContent}
      \`\`\`

      **API Route Definitions (from vite-app/api/routes/):**
      \`\`\`javascript
      ${apiRoutesContent}
      \`\`\`

      **Instructions:**
      Your response MUST be a single JSON object with the following structure. The 'file_path' you choose MUST exist in the list of valid files provided above.
      {
        "status": "pending",
        "analysis": "A detailed, expert-level explanation of the architectural issue or improvement you identified. Explain the problem and how your proposed change will solve it, referencing your core principles (e.g., security, performance, scalability).",
        "improvement": {
          "file_path": "The path to the file that needs to be changed, relative to the project root. CHOOSE FROM THE LIST ABOVE.",
          "old_string": "The exact line of code that needs to be replaced.",
          "new_string": "The new line of code that should replace the old one."
        }
      }

      Analyze the backend code and provide your feedback in the specified JSON format.
    `;

    console.log('\nAsking Gemini for a backend architecture review...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    const text = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : rawText;

    // --- SAVE THE STRUCTURED FEEDBACK ---
    const feedbackDir = path.join(__dirname, 'feedback');
    if (!fs.existsSync(feedbackDir)) fs.mkdirSync(feedbackDir, { recursive: true });

    const feedbackFilePath = path.join(feedbackDir, 'backend-feedback.json');
    fs.writeFileSync(feedbackFilePath, JSON.stringify(JSON.parse(text), null, 2));
    
    console.log(`\n✅ Backend feedback file generated at ${feedbackFilePath} with status 'pending'.`);
    console.log('============================================');
    console.log('🎉 BACKEND REVIEW COMPLETE');
    console.log('============================================');

  } catch (error) {
    console.error('\n============================================');
    console.error('❌ BACKEND REVIEW FAILED');
    console.error('============================================');
    console.error('An error occurred during the review process:', error);
  }
}

/**
 * ======================================================
 * SCRIPT ENTRY POINT (CLI HANDLER)
 * ======================================================
 */
const [,, command] = process.argv;

if (command === 'review-backend') {
  reviewBackend();
} else {
  console.log('Usage: node backend-architect-mcp-agent.js review-backend');
}