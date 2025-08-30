/**
 * ======================================================
 * FUNCTION: clickSignInButton
 * PURPOSE:  Click the 'Sign In' button in the navigation bar by its text.
 * PARAMETERS:
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 * ======================================================
 */
async function clickSignInButton(page) {
  // Robustly click the "Sign In" button in the navbar
  try {
    await page.waitForSelector('role=button[name="Sign In"]', { timeout: 5000 });
    await page.getByRole('button', { name: /sign in/i }).click();
  } catch (err) {
    throw new Error('Could not find or click the Sign In button');
  }
}
/**
 * ======================================================
 * FUNCTION: signOut
 * PURPOSE:  Automate logout and report success.
 * PARAMETERS: 
 * @param {import('playwright').Browser} browser - Playwright browser instance
 * @param {string} baseUrl - Base URL of the frontend
 * @param {object} [options] - Optional selectors and paths
 * @returns {Promise<boolean>} - Resolves true if logout successful, false otherwise
 * ======================================================
*/
async function signOut(browser, baseUrl, options = {}) {
  const page = options.page;
  if (!page) {
    console.error("signOut requires a page object in options.");
    return false;
  }
  const loginSelector = 'role=button[name="Sign In"]'; // Wait for the sign in button to appear

  // Take a full-page screenshot before any clicks for debugging
  console.log('Taking screenshot before user menu click...');
  await page.screenshot({ path: 'agents/screenshots/before-user-menu-full.png', fullPage: true });
  console.log('Screenshot saved as agents/screenshots/before-user-menu-full.png');
  let success = false;
  try {
    // 1. Click on user menu using a more robust selector
    console.log('Attempting to click user menu button...');
    const userMenuButtonSelector = 'button:has(svg.lucide-chevron-down)';
    try {
      await page.waitForSelector(userMenuButtonSelector, { timeout: 5000 });
      await page.click(userMenuButtonSelector);
      console.log('User menu button click succeeded.');
    } catch (menuErr) {
      console.log('User menu click failed, taking user-menu-click-failure screenshot...');
      await page.screenshot({ path: 'agents/screenshots/user-menu-click-failure.png' });
      console.log('Screenshot saved as agents/screenshots/user-menu-click-failure.png');
      console.error(menuErr);
      throw new Error('Failed to click user menu button. Screenshot saved.');
    }
    // 2. Wait for the dropdown to appear
    console.log('Waiting for sign out button to appear...');
    const signOutButtonSelector = 'button:has-text("Sign Out")';
    await page.waitForSelector(signOutButtonSelector, { timeout: 2000 });

    // 3. Take screenshot
    console.log('Taking after-user-menu-click screenshot...');
    await page.screenshot({ path: 'agents/screenshots/after-user-menu-click.png' });
    console.log('Screenshot saved as agents/screenshots/after-user-menu-click.png');
    // 4. Click on sign out
    console.log('Attempting to click "Sign Out" button...');
    await page.click(signOutButtonSelector);
    console.log('Clicked "Sign Out" button, waiting for login page...');
    await page.waitForSelector(loginSelector, { timeout: 5000 });
    console.log('Logout successful');
    success = true;
  } catch (err) {
    console.log('Logout failed');
    await page.screenshot({ path: 'agents/screenshots/logout-failure-debug.png' });
    console.log('Screenshot saved as agents/screenshots/logout-failure-debug.png');
    console.error(err);
  }
  return success;
}
// browserAuth.js
// Shared Playwright email/password login utility for MCP agents

/**
 * ======================================================
 * FUNCTION: signInEmailPassword
 * PURPOSE:  Automate email/password login and report success.
 * PARAMETERS:
 * @param {import('playwright').Browser} browser - Playwright browser instance
 * @param {string} baseUrl - Base URL of the frontend (e.g., https://plumbingpoc.netlify.app)
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} [options] - Optional selectors and paths
 * @returns {Promise<object>} - Resolves an object with success status and page object
 * ======================================================
 */
async function signInEmailPassword(browser, baseUrl, email, password, options = {}) {
  const page = await browser.newPage();
  const loginPath = options.loginPath || '/';
  const emailSelector = options.emailSelector || 'input[type="email"]';
  const passwordSelector = options.passwordSelector || 'input[type="password"]';
  const successSelector = options.successSelector || 'text=My Quote Requests'; // Adjusted for reliable login verification

  await page.goto(baseUrl + loginPath);
  // Click "Sign In" button to open modal
  console.log('Attempting to click Sign In button...');
  await clickSignInButton(page);
  // Wait for modal to appear
  console.log('Waiting for email input to appear...');
  await page.waitForSelector(emailSelector, { timeout: 10000 });
  // Take screenshot after modal appears
  await page.screenshot({ path: 'agents/screenshots/login-modal-debug.png' });
  console.log('Filling email and password...');
  await page.fill(emailSelector, email);
  await page.fill(passwordSelector, password);
  console.log('Clicking "Sign In with Email" button...');
  await page.getByRole('button', { name: /sign in with email/i }).click();

  let success = false;
  try {
    console.log('Waiting for dashboard or success indicator...');
    await page.waitForSelector(successSelector, { timeout: 10000 });
    console.log('Login successful for', email);
    await page.screenshot({ path: 'agents/screenshots/login-success-debug.png' });
    console.log('Screenshot saved as agents/screenshots/login-success-debug.png');
    success = true;
  } catch (err) {
    console.log('Login failed for', email);
    await page.screenshot({ path: 'agents/screenshots/login-failure-debug.png' });
    console.log('Screenshot saved as agents/screenshots/login-failure-debug.png');
  }
  return { success, page };
}

module.exports = { signInEmailPassword, signOut, clickSignInButton };