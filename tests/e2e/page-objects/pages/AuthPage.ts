import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.join(process.cwd(), '.env') });

/**
 * Page object for authentication functionality
 */
export class AuthPage extends BasePage {
  // Selectors
  private signInButton = '[data-testid="sign-in-button"], button:has-text("Sign In")';
  private emailInput = 'input[type="email"]';
  private passwordInput = 'input[type="password"]';
  private submitButton = 'button:has-text("Sign In with Email")';
  private userMenuButton = 'button:has(svg.lucide-chevron-down)';
  private signOutButton = 'button:has-text("Sign Out")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get test credentials from environment variables
   */
  private getTestCredentials() {
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
  private getAdminTestCredentials() {
    const email = process.env.TEST_ADMIN_USER_EMAIL;
    const password = process.env.TEST_ADMIN_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('Admin test credentials not found. Please set TEST_ADMIN_USER_EMAIL and TEST_ADMIN_USER_PASSWORD in .env');
    }

    return { email, password };
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<boolean> {
    try {
      console.log(`Attempting to sign in as: ${email}`);

      // Check if already logged in
      if (await this.isLoggedIn()) {
        console.log('✅ Already logged in, skipping sign-in');
        return true;
      }

      // Click Sign In button
      console.log('Clicking Sign In button...');
      await this.page.locator(this.signInButton).first().click();

      // Wait for email input
      console.log('Waiting for email input...');
      await this.waitForElement(this.emailInput);

      // Fill credentials
      console.log('Filling credentials...');
      await this.fillInput(this.emailInput, email);
      await this.fillInput(this.passwordInput, password);

      // Submit
      console.log('Submitting sign-in...');
      await this.page.locator(this.submitButton).click();

      // Wait for successful login
      console.log('Waiting for login success...');
      await this.waitForElement(this.userMenuButton, 15000);

      console.log(`✅ Successfully signed in as: ${email}`);
      return true;

    } catch (error) {
      console.error(`❌ Sign in failed for: ${email}`, error);
      await this.page.screenshot({
        path: `tests/e2e/screenshots/signin-failure-${Date.now()}.png`
      });
      return false;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<boolean> {
    try {
      console.log('Attempting to sign out...');

      // Click user menu
      await this.page.locator(this.userMenuButton).click();

      // Click sign out
      await this.page.locator(this.signOutButton).click();

      // Wait for sign in button to appear (confirming logout)
      await this.waitForElement(this.signInButton);

      console.log('✅ Successfully signed out');
      return true;

    } catch (error) {
      console.error('❌ Sign out failed', error);
      return false;
    }
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.userMenuButton, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user info from user menu
   */
  async getCurrentUser(): Promise<string | null> {
    if (!(await this.isLoggedIn())) {
      return null;
    }

    try {
      // Click user menu to open dropdown
      await this.page.locator(this.userMenuButton).click();

      // Look for user name in dropdown (first text element)
      const userName = await this.page.locator('.text-sm.font-medium.text-white').first().textContent();
      return userName || null;
    } catch {
      return null;
    }
  }

  /**
   * Ensure user is signed out (for test setup)
   */
  async ensureSignedOut(): Promise<void> {
    if (await this.isLoggedIn()) {
      await this.signOut();
    }
  }

  /**
   * Ensure user is signed in (for test setup)
   */
  async ensureSignedIn(email: string, password: string): Promise<void> {
    if (!(await this.isLoggedIn())) {
      const success = await this.signIn(email, password);
      if (!success) {
        throw new Error(`Failed to sign in as ${email}`);
      }
    }
  }

  /**
   * Sign in as a specific user type (user or admin)
   * Includes smart checking to avoid unnecessary login if already signed in as correct type
   */
  async signInAsUserType(userType: 'user' | 'admin'): Promise<void> {
    console.log(`Attempting to sign in as ${userType}...`);
    const { email, password } = userType === 'admin' ? this.getAdminTestCredentials() : this.getTestCredentials();

    const successSelector = userType === 'admin'
      ? this.page.getByRole('button', { name: 'Command Center' })
      : this.page.getByRole('button', { name: 'Dashboard' });

    // Check if we are already logged in as the correct user type
    if (await successSelector.count() > 0) {
      console.log(`✅ Already logged in as ${userType}. Skipping login flow.`);
      return;
    }

    // If not logged in, or logged in as the wrong user, proceed with login
    await this.page.goto('/');

    const mainSignInButton = this.page.getByRole('button', { name: 'Sign In' });
    await mainSignInButton.waitFor({ state: 'visible' });
    await mainSignInButton.click();

    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In with Email' }).click();

    // Wait for the login-specific success element to appear
    await expect(successSelector).toBeVisible({ timeout: 15000 });
    console.log(`✅ Successfully signed in as ${userType}.`);
  }
}