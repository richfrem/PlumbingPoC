/*
Create a Node.js script using Playwright to test a running Playwright MCP server at ws://localhost:63784. The script should:
- Connect to the Playwright MCP server at ws://localhost:63784.
- Test a web service running at http://localhost:5173 with the following scenario:
  1. Register/signup to the service (assume a form with fields for username, email, and password).
  2. Sign out (assume a signout button or link).
  3. Sign in using the same credentials.
- Use generic selectors (e.g., input[name="username"], button[type="submit"]) for form fields and buttons.
- Include error handling for connection failures, form submission errors, or navigation issues.
- Log each step (e.g., "Navigating to signup", "Signed in successfully") and report pass/fail status.
- Save test results to a file (e.g., test-results.json).
- Ensure the script is modular, well-commented, and suitable as a foundational test for other tests.
*/

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../vite-app/.env') });

const MCP_WS = 'ws://localhost:63784';
const BASE_URL = process.env.FRONTEND_BASE_URL;
const TEST_USER = {
  username: 'testuser_' + Math.floor(Math.random() * 10000),
  email: 'testuser_' + Math.floor(Math.random() * 10000) + '@example.com',
  password: 'Str0ng!P@ssw0rd#2025$' // Stronger password
};

async function runTest() {
  let browser;
  let results = { passed: false, steps: [], errors: [] };
  try {
    // Connect to Playwright MCP server
    results.steps.push('Connecting to Playwright MCP server...');
    browser = await chromium.connect(MCP_WS);
    const context = await browser.newContext();
    const page = await context.newPage();
    results.steps.push('Connected to Playwright MCP server');

    // Step 1: Register/signup
    results.steps.push('Navigating to signup page...');
    await page.goto(BASE_URL + '/signup');
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    results.steps.push('Signup submitted');

    // Step 2: Sign out
    results.steps.push('Signing out...');
    await page.click('a[href="/logout"],button#signout');
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    results.steps.push('Signout completed');

    // Step 3: Sign in
    results.steps.push('Navigating to sign-in page...');
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    results.steps.push('Sign-in completed');

    results.passed = true;
  } catch (error) {
    results.errors.push(error.message);
    results.steps.push('Error: ' + error.message);
  } finally {
    await fs.writeFile('test-results.json', JSON.stringify(results, null, 2));
    if (browser) await browser.close();
  }
  console.log('Test results:', results);
  return results;
}

runTest().catch(console.error);