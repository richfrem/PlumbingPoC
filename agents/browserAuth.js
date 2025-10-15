const { logger } = require('../packages/frontend/src/lib/logger');


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
  const loginSelector = 'role=button[name="Sign In"]';

  let success = false;
  try {
    logger.log('Attempting to click user menu button...');
    const userMenuButtonSelector = 'button:has(svg.lucide-chevron-down)';
    await page.waitForSelector(userMenuButtonSelector, { timeout: 5000 });
    await page.click(userMenuButtonSelector);

    logger.log('Waiting for sign out button to appear...');
    const signOutButtonSelector = 'button:has-text("Sign Out")';
    await page.waitForSelector(signOutButtonSelector, { timeout: 2000 });

    logger.log('Attempting to click "Sign Out" button...');
    await page.click(signOutButtonSelector);

    await page.waitForSelector(loginSelector, { timeout: 5000 });
    logger.log('Logout successful');
    success = true;
  } catch (err) {
    logger.log('Logout failed');
    await page.screenshot({ path: 'screenshots/logout-failure-debug.png' });
    logger.log('Screenshot saved as screenshots/logout-failure-debug.png');
    console.error(err);
  }
  return success;
}

/**
 * ======================================================
 * FUNCTION: signInEmailPassword (UPDATED for Admin & Regular Users)
 * PURPOSE:  Ensures the user is logged in, regardless of role. It checks
 *           for the universal User Menu button as a success indicator.
 * ======================================================
 */
async function signInEmailPassword(browser, baseUrl, email, password, options = {}) {
  const page = await browser.newPage();
  const loginPath = options.loginPath || '/';
  const emailSelector = options.emailSelector || 'input[type="email"]';
  const passwordSelector = options.passwordSelector || 'input[type="password"]';

  // --- THE FIX IS HERE ---
  // The new success selector is not role-specific. It looks for the user menu button
  // that appears for ANY successfully logged-in user.
  const successSelector = options.successSelector || 'button:has(svg.lucide-chevron-down)';

  await page.goto(baseUrl + loginPath);

  try {
    // First, check if we are ALREADY logged in by looking for the universal success selector.
    logger.log(`Checking for existing login session by looking for: "User Menu Button"`);
    await page.waitForSelector(successSelector, { timeout: 3000 }); // Short timeout

    // If the selector is found, we're already logged in.
    logger.log('✅ Already logged in. Skipping login flow.');
    return { success: true, page };

  } catch (e) {
    // If the success selector is not found, it means we are not logged in.
    logger.log('Not logged in. Proceeding with sign-in flow...');
    try {
      logger.log('Attempting to click Sign In button...');
      await clickSignInButton(page);

      logger.log('Waiting for email input to appear...');
      await page.waitForSelector(emailSelector, { timeout: 10000 });

      logger.log('Filling email and password...');
      await page.fill(emailSelector, email);
      await page.fill(passwordSelector, password);

      logger.log('Clicking "Sign In with Email" button...');
      await page.getByRole('button', { name: /sign in with email/i }).click();

      logger.log('Waiting for login success indicator (User Menu)...');
      await page.waitForSelector(successSelector, { timeout: 10000 });

      logger.log('Login successful for', email);
      return { success: true, page };

    } catch (loginErr) {
      logger.log('Login failed for', email);
      await page.screenshot({ path: 'screenshots/login-failure-debug.png' });
      logger.log('Screenshot saved as agents/screenshots/login-failure-debug.png');
      return { success: false, page };
    }
  }
}

module.exports = { signInEmailPassword, signOut, clickSignInButton };
