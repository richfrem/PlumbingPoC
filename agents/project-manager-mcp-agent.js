// Node.js agent script for Playwright MCP server
// Connects to ws://your-local-playwright-server// and automates dashboard access

/*
 MCP Project Manager Agent
 Implements the project-manager-mcp persona:
 - Connects to Playwright MCP server at ws://your-local-playwright-server/
 - Tracks requirements, completed tasks, and outstanding tasks
 - Assigns tasks to agents
 - Monitors task status and blockers
 - Provides progress reports and next steps
 - Uses Playwright for browser tasks, file I/O, and CLI commands
 - Maintains a task list (in-memory and tasks.json)
 - Supports CLI commands for status, assignment, and reports
*/

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from vite-app
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// In-memory task list
let tasks = [];

// Load tasks from file
async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    tasks = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      tasks = [];
    } else {
      console.error('Error loading tasks:', err);
    }
  }
}

// Save tasks to file
async function saveTasks() {
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error('Error saving tasks:', err);
  }
}

// Add a new task
async function addTask(description, agent, requirement = '', status = 'pending') {
  const id = `task${tasks.length + 1}`;
  const task = { id, description, agent, requirement, status, blockers: [] };
  tasks.push(task);
  await saveTasks();
  console.log(`Added task: ${id} (${description}) assigned to ${agent}`);
}

// Assign a task to an agent
async function assignTask(id, agent) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.agent = agent;
    await saveTasks();
    console.log(`Task ${id} assigned to ${agent}`);
  } else {
    console.log(`Task ${id} not found.`);
  }
}

// Update task status
async function updateTaskStatus(id, status) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    await saveTasks();
    console.log(`Task ${id} status updated to ${status}`);
  } else {
    console.log(`Task ${id} not found.`);
  }
}

// Add blocker to a task
async function addBlocker(id, blocker) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.blockers.push(blocker);
    await saveTasks();
    console.log(`Blocker added to task ${id}: ${blocker}`);
  } else {
    console.log(`Task ${id} not found.`);
  }
}

// Provide progress report
function progressReport() {
  const completed = tasks.filter(t => t.status === 'completed');
  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  console.log('--- Progress Report ---');
  console.log(`Completed: ${completed.length}`);
  completed.forEach(t => console.log(`  - ${t.id}: ${t.description}`));
  console.log(`In Progress: ${inProgress.length}`);
  inProgress.forEach(t => console.log(`  - ${t.id}: ${t.description} (Agent: ${t.agent})`));
  console.log(`Pending: ${pending.length}`);
  pending.forEach(t => console.log(`  - ${t.id}: ${t.description} (Agent: ${t.agent})`));
  console.log('-----------------------');
}

// Connect to Playwright MCP server
async function connectToPlaywright() {
  try {
    const browser = await chromium.connect('{{PLAYWRIGHT_MCP_SERVER_URL}}');
    console.log('Connected to Playwright MCP server');
    return browser;
  } catch (error) {
    console.error('Failed to connect to Playwright MCP server:', error);
    return null;
  }
}

// Example browser task: check dashboard title
async function checkDashboard(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(process.env.VITE_FRONTEND_BASE_URL);
    const title = await page.title();
    console.log('Dashboard Title:', title);
    await page.close();
  } catch (err) {
    console.error('Error checking dashboard:', err);
  }
}

// CLI command handler
async function handleCli(args) {
  await loadTasks();
  const cmd = args[0];
  switch (cmd) {
    case 'add-task':
      await addTask(args[1], args[2], args[3] || '', args[4] || 'pending');
      break;
    case 'assign-task':
      await assignTask(args[1], args[2]);
      break;
    case 'update-status':
      await updateTaskStatus(args[1], args[2]);
      break;
    case 'add-blocker':
      await addBlocker(args[1], args[2]);
      break;
    case 'report':
      progressReport();
      break;
    case 'browser-check':
      const browser = await connectToPlaywright();
      if (browser) await checkDashboard(browser);
      if (browser) await browser.close();
      break;
    default:
      console.log('Commands: add-task <desc> <agent> [requirement] [status], assign-task <id> <agent>, update-status <id> <status>, add-blocker <id> <blocker>, report, browser-check');
  }
}

// Entry point
if (require.main === module) {
  handleCli(process.argv.slice(2)).catch(console.error);
}