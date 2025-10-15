/**
 * =====================================================================================
 * AGENT NAME: UI Designer MCP Agent (Target-Aware Version)
 * FILE:       agents/ui-designer-mcp-agent.js
 * =====================================================================================
 *
 * @description
 * This agent can now follow a "mission" to analyze specific parts of the application.
 * Use the --target flag to specify which UI component to analyze. It generates
 * multiple feedback items in a single, structured JSON file.
 *
 * @usage
 * Run from inside the 'agents/' directory:
 *
 * # Analyze the main dashboard (default)
 * node ui-designer-mcp-agent.js analyze-ui <email> <password>
 *
 * # Analyze the Request Detail Modal
 * node ui-designer-mcp-agent.js analyze-ui <email> <password> --target request-detail-modal
 *
 * # Analyze the Quote Agent Modal
 * node ui-designer-mcp-agent.js analyze-ui <email> <password> --target quote-agent-modal
 *
 * =====================================================================================
 */
const { chromium } = require('playwright');
const { signInEmailPassword } = require('./browserAuth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { editableFileManifest } = require('./projectFileManifest.js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { logger } = require('../packages/frontend/src/lib/logger');


const FRONTEND_BASE_URL = process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: { data: Buffer.from(fs.readFileSync(filePath)).toString("base64"), mimeType },
  };
}

async function generateFeedback(screenshotPath) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const personaContent = fs.readFileSync(path.join(__dirname, 'ui-designer-mcp.md'), 'utf8');
    const imageParts = [ fileToGenerativePart(screenshotPath, "image/png") ];

    const prompt = `
      ${personaContent}
      ---------------------------
      CONTEXT: VALID FILE PATHS
      ---------------------------
      Here is a list of files you are allowed to modify. You MUST choose file paths from this list.
      \`\`\`json
      ${JSON.stringify(editableFileManifest, null, 2)}
      \`\`\`
      ---------------------------
      YOUR CURRENT TASK
      ---------------------------
      Analyze the provided screenshot. Identify up to THREE (3) distinct, high-impact, actionable improvements that can each be implemented by changing a single line of code.

      Your response MUST be a single JSON object with an 'improvements' ARRAY. Each 'file_path' you choose MUST exist in the list provided above.
      {
        "status": "pending",
        "analysis": "A high-level summary of all the UI/UX issues you identified in the screenshot.",
        "improvements": [
          {
            "file_path": "path/to/file_one.tsx",
            "old_string": "The exact line of code to be replaced.",
            "new_string": "The new line of code."
          }
        ]
      }
      Analyze the screenshot and provide your comprehensive feedback in the specified JSON format.
    `;

    logger.log('Analyzing screenshot for multiple improvements...');
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const rawText = response.text();
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    const text = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : rawText;

    const feedbackDir = path.join(__dirname, 'feedback');
    if (!fs.existsSync(feedbackDir)) fs.mkdirSync(feedbackDir, { recursive: true });

    const feedbackFilePath = path.join(feedbackDir, 'ui-feedback.json');
    fs.writeFileSync(feedbackFilePath, JSON.stringify(JSON.parse(text), null, 2));
    logger.log(`Feedback file generated at ${feedbackFilePath} with multiple suggestions.`);
  } catch (error) {
    console.error('Error during feedback generation:', error);
  }
}

/**
 * ======================================================
 * FUNCTION: analyzeUI
 * PURPOSE:  Orchestrates the analysis workflow based on the specified target.
 * ======================================================
 */
async function analyzeUI(email, password, target) {
  let browser;
  let page;
  try {
    browser = await chromium.connectOverCDP(process.env.PLAYWRIGHT_SERVER_URL || 'http://localhost:49982/');
    logger.log('Connected to Playwright MCP server');

    const { success: loginSuccess, page: newPage } = await signInEmailPassword(browser, FRONTEND_BASE_URL, email, password);
    page = newPage;

    if (loginSuccess) {
      logger.log(`Login successful. Analyzing target: '${target}'`);

      let screenshotPath = path.join(__dirname, `screenshots/${target}-analysis.png`);

      // --- NEW: Mission Script Logic ---
      switch (target) {
        case 'request-detail-modal':
          logger.log('Navigating to open the first request detail modal...');
          // This selector finds the first button-like element inside the "My Requests" section.
          await page.click('#my-requests [role="button"]:first-of-type');
          // Wait for a unique element inside the modal to ensure it's loaded.
          await page.waitForSelector('h5:has-text("Job Docket")');
          logger.log('Request Detail Modal is open.');
          break;

        case 'quote-agent-modal':
          logger.log('Navigating to open the quote agent modal...');
          await page.click('role=button[name="Request a Quote"]');
          // Wait for a unique element inside this modal.
          await page.waitForSelector('h2:has-text("Request a Quote")');
          logger.log('Quote Agent Modal is open.');
          break;

        case 'dashboard':
        default:
          logger.log('Analyzing main dashboard view.');
          // No extra clicks needed for the dashboard.
          break;
      }

      await page.screenshot({ path: screenshotPath, fullPage: true });
      logger.log(`Screenshot for '${target}' saved to ${screenshotPath}`);

      await generateFeedback(screenshotPath);

    } else {
      logger.log('Login failed. Cannot analyze UI.');
    }
  } catch (error) {
    console.error(`An error occurred during analysis of target '${target}':`, error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    logger.log('Browser session closed.');
  }
}

/**
 * ======================================================
 * SCRIPT ENTRY POINT (CLI HANDLER with --target flag)
 * ======================================================
 */
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];
const password = args[2];

// Default target is 'dashboard'
let target = 'dashboard';
const targetIndex = args.indexOf('--target');
if (targetIndex !== -1 && args[targetIndex + 1]) {
  const specifiedTarget = args[targetIndex + 1];
  if (['dashboard', 'request-detail-modal', 'quote-agent-modal'].includes(specifiedTarget)) {
    target = specifiedTarget;
  } else {
    console.error(`Invalid target specified: "${specifiedTarget}". Using default 'dashboard'.`);
  }
}

if (command === 'analyze-ui' && email && password) {
  analyzeUI(email, password, target);
} else {
  logger.log('Usage: node ui-designer-mcp-agent.js analyze-ui <email> <password> [--target <target_name>]');
}
