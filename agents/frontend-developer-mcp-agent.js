/**
 * =====================================================================================
 * AGENT NAME: Frontend Developer MCP Agent (Multi-Feedback Version)
 * FILE:       agents/frontend-developer-mcp-agent.js
 * =====================================================================================
 *
 * @description
 * This agent processes a feedback file containing an ARRAY of improvements. It applies
 * all changes, then runs a single build verification. If the build fails, it rolls
 * back ALL changes, ensuring the codebase remains stable.
 *
 * @usage
 * Run from inside the 'agents/' directory:
 * node frontend-developer-mcp-agent.js implement-feedback --feedback-file feedback/ui-feedback.json
 *
 * =====================================================================================
 */
const { chromium } = require('playwright');
const { signInEmailPassword, signOut } = require('./browserAuth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_BASE_URL = process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ======================================================
 * FUNCTION: implementFeedback
 * PURPOSE:  Processes a BATCH of improvements, verifies, and rolls back if needed.
 * ======================================================
 */
async function implementFeedback(feedbackFilePath) {
  const absoluteFeedbackPath = path.resolve(__dirname, feedbackFilePath);
  if (!fs.existsSync(absoluteFeedbackPath)) {
    console.error(`Error: Feedback file not found at ${absoluteFeedbackPath}`);
    return;
  }

  const feedback = JSON.parse(fs.readFileSync(absoluteFeedbackPath, 'utf-8'));

  if (feedback.status === 'implemented') {
    console.log("✅ Feedback has already been implemented. No action taken.");
    return;
  }

  const { analysis, improvements } = feedback;
  if (!improvements || !Array.isArray(improvements)) {
    throw new Error("Feedback file is malformed: 'improvements' key is missing or not an array.");
  }

  const projectRoot = path.resolve(__dirname, '..');
  // Store original content of all files to be modified for potential rollback
  const originalFiles = new Map();

  try {
    console.log(`Found ${improvements.length} improvements to implement. Proceeding...`);

    // --- BATCH IMPLEMENTATION LOOP ---
    for (const improvement of improvements) {
      const { file_path, old_string, new_string } = improvement;
      const absoluteTargetFilePath = path.resolve(projectRoot, file_path);

      if (!fs.existsSync(absoluteTargetFilePath)) {
        throw new Error(`Target source code file not found at ${absoluteTargetFilePath}`);
      }

      // Save original content if we haven't already
      if (!originalFiles.has(absoluteTargetFilePath)) {
        originalFiles.set(absoluteTargetFilePath, fs.readFileSync(absoluteTargetFilePath, 'utf-8'));
      }

      // Read the most current content for this iteration
      let currentSourceCode = fs.readFileSync(absoluteTargetFilePath, 'utf-8');

      // Simple string replacement for this batch model
      const updatedSourceCode = currentSourceCode.replace(old_string, new_string);

      fs.writeFileSync(absoluteTargetFilePath, updatedSourceCode);
      console.log(`Applied change to ${file_path}`);
    }

    // --- SINGLE VERIFICATION STEP ---
    console.log('\n--- All changes applied. Verifying with a single build command... ---');
    try {
      execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
      console.log('✅ Build successful! All changes are valid.');
    } catch (buildError) {
      throw new Error('Build verification failed after applying batch changes.');
    }

    // If build succeeds, update the feedback status
    feedback.status = 'implemented';
    fs.writeFileSync(absoluteFeedbackPath, JSON.stringify(feedback, null, 2));
    console.log(`✅ Updated feedback file status to 'implemented'.`);

  } catch (error) {
    console.error(`\n--- An error occurred during implementation: ${error.message} ---`);
    console.log('--- ROLLING BACK all changes... ---');

    // Rollback all modified files to their original state
    for (const [filePath, originalContent] of originalFiles.entries()) {
      fs.writeFileSync(filePath, originalContent);
      console.log(`✅ Reverted ${path.relative(projectRoot, filePath)}`);
    }

    throw new Error("Implementation failed and all changes were rolled back.");
  }
}

/**
 * ======================================================
 * FUNCTION: loginLogoutTest
 * PURPOSE:  Performs a simple end-to-end test and ensures cleanup.
 * ======================================================
 */
async function loginLogoutTest(email, password) {
  let browser;
  let page;
  try {
    browser = await chromium.connectOverCDP(process.env.PLAYWRIGHT_SERVER_URL || 'http://localhost:49982/');
    console.log('Connected to Playwright MCP server');

    const { success: loginSuccess, page: newPage } = await signInEmailPassword(browser, FRONTEND_BASE_URL, email, password);
    page = newPage;

    if (loginSuccess) {
      console.log('Login test: SUCCESS');
      const logoutSuccess = await signOut(browser, FRONTEND_BASE_URL, { page });
      if (logoutSuccess) console.log('Logout test: SUCCESS');
      else console.log('Logout test: FAILED');
    } else {
      console.log('Login test: FAILED');
    }
  } catch(error) {
    console.error('An error occurred during the login/logout test:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('Browser session closed.');
  }
}

/**
 * ======================================================
 * SCRIPT ENTRY POINT (CLI HANDLER)
 * ======================================================
 */
const [,, command, ...args] = process.argv;

(async () => {
  if (command === 'login-logout-test') {
    const [email, password] = args;
    if (email && password) {
      await loginLogoutTest(email, password);
    } else {
      console.log('Usage: node frontend-developer-mcp-agent.js login-logout-test <email> <password>');
    }
  } else if (command === 'implement-feedback') {
    const feedbackFileIndex = args.indexOf('--feedback-file');
    if (feedbackFileIndex !== -1 && args[feedbackFileIndex + 1]) {
      try {
        await implementFeedback(args[feedbackFileIndex + 1]);
      } catch (e) {
        process.exit(1);
      }
    } else {
      console.log('Usage: node frontend-developer-mcp-agent.js implement-feedback --feedback-file <path>');
    }
  } else {
    console.log('Invalid command. Available commands: login-logout-test, implement-feedback');
  }
})();
