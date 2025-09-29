import { Page } from '@playwright/test';

/**
 * Base page object with common functionality
 */
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string) {
    await this.page.goto(url);
  }

  /**
   * Wait for page to load completely
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout, state: 'visible' });
  }

  /**
   * Click an element with force option for stubborn elements
   */
  async clickForce(selector: string) {
    await this.page.locator(selector).click({ force: true });
  }

  /**
   * Fill a text input
   */
  async fillInput(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string, statusCode = 200, timeout = 30000) {
    return await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === statusCode,
      { timeout }
    );
  }
}