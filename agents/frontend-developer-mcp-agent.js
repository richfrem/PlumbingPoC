// MCP Frontend Developer Agent
// PRECONDITIONS: 
// close all chrome instances. 
// Start Chrome or Chromium in remote-debugging mode:
// For Chrome:
//   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-mcp
// For Chromium:
//   chromium --remote-debugging-port=9222
// Usage: node agents/frontend-developer-mcp-agent.js login-logout-test <email> <password>
const { chromium } = require('playwright');
const { signInEmailPassword, signOut } = require('./browserAuth');
require('dotenv').config();

const FRONTEND_BASE_URL = process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';
const successSelector = 'text=My Quote Requests';

async function loginLogoutTest(email, password) {
  const browser = await chromium.connectOverCDP(process.env.PLAYWRIGHT_SERVER_URL || 'http://localhost:49982/');
  console.log('Connected to Playwright MCP server');
  const { success: loginSuccess, page } = await signInEmailPassword(browser, FRONTEND_BASE_URL, email, password);
  if (loginSuccess) {
    console.log('Login test: SUCCESS');
    const logoutSuccess = await signOut(browser, FRONTEND_BASE_URL, { page });
    if (logoutSuccess) {
      console.log('Logout test: SUCCESS');
    } else {
      console.log('Logout test: FAILED');
    }
  } else {
    console.log('Login test: FAILED');
  }
  if (page) await page.close();
  await browser.close();
}

// CLI handler
const [,, command, email, password] = process.argv;
if (command === 'login-logout-test' && email && password) {
  loginLogoutTest(email, password);
} else {
  console.log('Usage: node agents/frontend-developer-mcp-agent.js login-logout-test <email> <password>');
}
