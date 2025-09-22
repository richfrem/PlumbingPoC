import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';

/**
 * Component Page Object for Command Menu (User Dropdown) functionality
 * Handles user menu interactions, navigation, and account actions
 */
export class CommandMenu extends BasePage {
  // Selectors
  private userMenuButton = 'button:has(svg.lucide-chevron-down)';
  private commandCenterButton = 'button:has-text("Command Center")';
  private profileButton = 'button:has-text("Profile")';
  private settingsButton = 'button:has-text("Settings")';
  private signOutButton = 'button:has-text("Sign Out")';
  private signInButton = 'button:has-text("Sign In")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the user dashboard menu dropdown
   */
  async openMenu(): Promise<void> {
    console.log('Opening dashboard user menu...');

    const menuButton = this.page.locator(this.userMenuButton);
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();

    console.log('✅ Dashboard menu opened successfully.');
  }

  /**
   * Navigate to admin Command Center from dashboard
   */
  async navigateToCommandCenter(): Promise<void> {
    console.log('Navigating to Command Center...');

    await this.openMenu();

    const commandCenterBtn = this.page.locator(this.commandCenterButton);
    await commandCenterBtn.waitFor({ state: 'visible' });
    await commandCenterBtn.click();

    // Wait for navigation to complete
    await this.page.waitForURL('**/admin/dashboard');
    await expect(this.page.getByRole('heading', { name: "Plumber's Command Center" })).toBeVisible();

    console.log('✅ Successfully navigated to Command Center.');
  }

  /**
   * Navigate to profile settings from dashboard menu
   */
  async navigateToProfileSettings(): Promise<void> {
    console.log('Navigating to profile settings...');

    await this.openMenu();

    // Try different possible profile/settings button names
    const profileSelectors = [
      this.page.getByRole('button', { name: /profile/i }),
      this.page.getByRole('button', { name: /settings/i }),
      this.page.getByRole('button', { name: /account/i })
    ];

    for (const selector of profileSelectors) {
      if (await selector.count() > 0) {
        await selector.click();
        console.log('✅ Successfully navigated to profile settings.');
        return;
      }
    }

    console.log('ℹ️ Profile/settings option not found in menu.');
  }

  /**
   * Sign out from any dashboard
   */
  async signOut(): Promise<void> {
    console.log('Signing out from dashboard...');

    await this.openMenu();

    const signOutBtn = this.page.locator(this.signOutButton);
    await signOutBtn.waitFor({ state: 'visible' });
    await signOutBtn.click();

    // Confirm sign-out by waiting for the main "Sign In" button to reappear
    await expect(this.page.locator(this.signInButton)).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully signed out.');
  }

  /**
   * Check if user menu is visible (user is logged in)
   */
  async isMenuVisible(): Promise<boolean> {
    const menuButton = this.page.locator(this.userMenuButton);
    return await menuButton.isVisible();
  }

  /**
   * Check if user menu is open
   */
  async isMenuOpen(): Promise<boolean> {
    // Check if menu dropdown is visible (this would need to be adjusted based on actual dropdown structure)
    const menuDropdown = this.page.locator('[role="menu"], .MuiMenu-root, .dropdown-menu');
    return await menuDropdown.isVisible();
  }

  /**
   * Close the user menu if it's open
   */
  async closeMenu(): Promise<void> {
    console.log('Closing user menu...');

    // Click outside the menu or press Escape
    await this.page.keyboard.press('Escape');

    // Wait a moment for menu to close
    await this.page.waitForTimeout(500);

    console.log('✅ User menu closed.');
  }

  /**
   * Get available menu options
   */
  async getMenuOptions(): Promise<string[]> {
    console.log('Getting available menu options...');

    await this.openMenu();

    // Find all menu buttons/items
    const menuItems = this.page.locator('[role="menu"] button, .MuiMenu-root button, .dropdown-menu button');
    const options: string[] = [];

    const count = await menuItems.count();
    for (let i = 0; i < count; i++) {
      const text = await menuItems.nth(i).textContent();
      if (text) {
        options.push(text.trim());
      }
    }

    await this.closeMenu();
    return options;
  }
}