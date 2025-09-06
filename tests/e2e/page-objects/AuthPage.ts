import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

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

      // Look for user info in dropdown
      const userInfo = await this.page.locator('[data-testid="user-info"]').textContent();
      return userInfo || null;
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
}