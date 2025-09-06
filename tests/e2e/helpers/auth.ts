import { Page } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.join(process.cwd(), '.env') });

/**
 * Test authentication helper using the same logic as browserAuth.js
 */
export async function signInForTest(page: Page, email: string, password: string): Promise<boolean> {
  try {
    // First, check if we are ALREADY logged in by looking for the universal success selector.
    const successSelector = 'button:has(svg.lucide-chevron-down)';
    console.log(`Checking for existing login session by looking for: "User Menu Button"`);
    try {
      await page.waitForSelector(successSelector, { timeout: 3000 }); // Short timeout

      // If the selector is found, we're already logged in.
      console.log('✅ Already logged in. Skipping login flow.');
      return true;
    } catch (e) {
      // If the success selector is not found, it means we are not logged in.
      console.log('Not logged in. Proceeding with sign-in flow...');
    }

    // Click Sign In button (exact same as browserAuth.js)
    console.log('Attempting to click Sign In button...');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for email input to appear (exact same as browserAuth.js)
    console.log('Waiting for email input to appear...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill email and password (exact same as browserAuth.js)
    console.log('Filling email and password...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Click "Sign In with Email" button (exact same as browserAuth.js)
    console.log('Clicking "Sign In with Email" button...');
    await page.getByRole('button', { name: /sign in with email/i }).click();

    // Wait for login success indicator (User Menu) (exact same as browserAuth.js)
    console.log('Waiting for login success indicator (User Menu)...');
    await page.waitForSelector(successSelector, { timeout: 10000 });

    console.log('Login successful for', email);
    return true;

  } catch (error) {
    console.log('Login failed for', email);
    await page.screenshot({ path: `tests/e2e/screenshots/login-failure-${Date.now()}.png` });
    console.error('Login error:', error);
    return false;
  }
}

/**
 * Get test credentials from environment variables
 */
export function getTestCredentials() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('Test credentials not found. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env');
  }

  return { email, password };
}

/**
 * Get admin test credentials from environment variables
 */
export function getAdminTestCredentials() {
  const email = process.env.TEST_ADMIN_USER_EMAIL;
  const password = process.env.TEST_ADMIN_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('Admin test credentials not found. Please set TEST_ADMIN_USER_EMAIL and TEST_ADMIN_USER_PASSWORD in .env');
  }

  return { email, password };
}