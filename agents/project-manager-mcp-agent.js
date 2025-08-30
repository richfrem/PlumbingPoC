/**
 * =====================================================================================
 * AGENT NAME: Project Manager MCP Agent (Target-Aware Version)
 * FILE:       agents/project-manager-mcp-agent.js
 * =====================================================================================
 *
 * @description
 * This agent orchestrates the full UI improvement workflow. It can now be directed
 * to a specific UI component using the --target flag, which it passes to the
 * UI Designer agent to initiate a focused analysis.
 *
 * @usage
 * Run from inside the 'agents/' directory:
 * # Analyze the Request Detail Modal
 * node project-manager-mcp-agent.js run-workflow <email> <password> --target request-detail-modal
 *
 * # Analyze the Quote Agent Modal
 * node project-manager-mcp-agent.js run-workflow <email> <password> --target quote-agent-modal
 *
 * =====================================================================================
 */
const { exec } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { editableFileManifest } = require('./projectFileManifest.js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️ EXECUTING: ${command}`);
    const childProcess = exec(command, { cwd: __dirname });
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
    childProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${command}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * ======================================================
 * FUNCTION: runWorkflow
 * PURPOSE:  Orchestrates the workflow against a specific target.
 * ======================================================
 */
async function runWorkflow(email, password, target) {
  console.log('============================================');
  console.log(`🚀 STARTING PROJECT MANAGER WORKFLOW for target: '${target}'`);
  console.log('============================================');

  const feedbackFilePath = path.join(__dirname, 'feedback', 'ui-feedback.json');

  try {
    // === STEP 1: Run the UI Designer Agent with the specified target ===
    console.log(`\n--- STEP 1: Assigning task to UI Designer Agent for target '${target}' ---`);
    const designerCommand = `node ui-designer-mcp-agent.js analyze-ui ${email} ${password} --target ${target}`;
    await runCommand(designerCommand);
    console.log('✅ UI Designer Agent finished analysis.');

    // === STEP 2: Project Manager Reviews, VALIDATES BATCH, and Assigns Task ===
    console.log('\n--- STEP 2: Reviewing and VALIDATING feedback batch ---');
    if (!fs.existsSync(feedbackFilePath)) {
      throw new Error('Critical Error: ui-feedback.json was not generated.');
    }
    const feedback = JSON.parse(fs.readFileSync(feedbackFilePath, 'utf-8'));

    if (!feedback.improvements || !Array.isArray(feedback.improvements)) {
      throw new Error(`VALIDATION FAILED: Feedback file is malformed. 'improvements' array not found.`);
    }

    for (const improvement of feedback.improvements) {
      const proposedFilePath = improvement.file_path;
      if (!proposedFilePath || !editableFileManifest.includes(proposedFilePath)) {
        throw new Error(`VALIDATION FAILED: An invalid file path was proposed: "${proposedFilePath}". Halting workflow.`);
      }
    }
    console.log(`✅ Validation successful: All ${feedback.improvements.length} proposed file paths are in the manifest.`);
    
    if (feedback.status === 'implemented') {
      console.log("✅ Task has already been implemented. Archiving and completing workflow.");
      const archiveDir = path.join(__dirname, 'feedback', 'archive');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const archivePath = path.join(archiveDir, `ui-feedback-${timestamp}.json`);
      fs.renameSync(feedbackFilePath, archivePath);
      console.log(`✅ Task archived to: ${archivePath}`);
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const personaContent = fs.readFileSync(path.join(__dirname, 'project-manager-mcp.md'), 'utf8');

    const prompt = `
      ${personaContent}
      ---------------------------
      YOUR CURRENT TASK
      ---------------------------
      You have received and validated the following BATCH of UI/UX feedback for the '${target}' component. Your task is to create a brief summary and assign the entire batch to the 'frontend-developer-mcp' agent.
      
      **Designer Feedback (Status: ${feedback.status}):**
      \`\`\`json
      ${JSON.stringify(feedback, null, 2)}
      \`\`\`
    `;
    
    const result = await model.generateContent(prompt);
    const summary = await result.response.text();
    console.log('\n--- PROJECT MANAGER STATUS UPDATE ---');
    console.log(summary);
    console.log('-------------------------------------\n');

    // === STEP 3: Run the Frontend Developer Agent ===
    console.log('\n--- STEP 3: Assigning implementation task to Frontend Developer Agent ---');
    await runCommand(`node frontend-developer-mcp-agent.js implement-feedback --feedback-file feedback/ui-feedback.json`);
    console.log('✅ Frontend Developer Agent finished implementation.');

    // === STEP 4: Verification and Archiving ===
    console.log('\n--- STEP 4: Verifying implementation and archiving task ---');
    const updatedFeedback = JSON.parse(fs.readFileSync(feedbackFilePath, 'utf-8'));

    if (updatedFeedback.status === 'implemented') {
        console.log('Verification successful. Status is "implemented".');
        
        const archiveDir = path.join(__dirname, 'feedback', 'archive');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const archivePath = path.join(archiveDir, `ui-feedback-${timestamp}.json`);
        fs.renameSync(feedbackFilePath, archivePath);
        console.log(`✅ Task archived to: ${archivePath}`);
    } else {
        throw new Error(`Verification FAILED. Expected status 'implemented', but found '${updatedFeedback.status}'.`);
    }

    // === STEP 5: Final Summary ===
    console.log('\n============================================');
    console.log('🎉 WORKFLOW COMPLETED SUCCESSFULLY');
    console.log('============================================');
    console.log(`The '${target}' UI has been updated and the workflow is complete.`);

  } catch (error) {
    console.error('\n============================================');
    console.error('❌ WORKFLOW FAILED');
    console.error('============================================');
    console.error('An error occurred during the workflow:', error.message);
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

let target = 'dashboard'; // Default target
const targetIndex = args.indexOf('--target');
if (targetIndex !== -1 && args[targetIndex + 1]) {
  target = args[targetIndex + 1];
}

if (command === 'run-workflow' && email && password) {
  runWorkflow(email, password, target);
} else {
  console.log('Usage: node project-manager-mcp-agent.js run-workflow <email> <password> [--target <target_name>]');
}