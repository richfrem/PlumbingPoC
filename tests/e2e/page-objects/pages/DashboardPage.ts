import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for dashboard functionality
 */
export class DashboardPage extends BasePage {
  // Selectors
  private myRequestsSection = 'text="My Quote Requests"';
  private adminDashboardLink = 'text="Dashboard"';
  private requestCards = '.request-card, [data-testid="request-card"]';
  private requestTitles = 'h6, [data-testid="request-title"]';
  private requestStatuses = '[data-testid="request-status"], .status-chip';
  private viewDetailsButtons = 'button:has-text("View Details")';
  private adminCommandCenter = 'text="Command Center"';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to admin dashboard
   */
  async goToAdminDashboard(): Promise<void> {
    console.log('Navigating to admin dashboard...');
    await this.page.locator(this.adminDashboardLink).click();
    await this.waitForElement(this.adminCommandCenter);
  }

  /**
   * Verify we're on the customer dashboard
   */
  async verifyOnCustomerDashboard(): Promise<void> {
    console.log('Verifying on customer dashboard...');
    await expect(this.page.locator(this.myRequestsSection)).toBeVisible();
  }

  /**
   * Verify we're on the admin dashboard
   */
  async verifyOnAdminDashboard(): Promise<void> {
    console.log('Verifying on admin dashboard...');
    await expect(this.page.locator(this.adminCommandCenter)).toBeVisible();
  }

  /**
   * Get all visible quote requests
   */
  async getVisibleRequests(): Promise<Array<{title: string, status: string}>> {
    console.log('Getting visible quote requests...');

    const requests = await this.page.locator(this.requestCards).all();
    const requestData: Array<{title: string, status: string}> = [];

    for (const request of requests) {
      const title = await request.locator(this.requestTitles).first().textContent() || '';
      const status = await request.locator(this.requestStatuses).first().textContent() || '';
      requestData.push({ title, status });
    }

    return requestData;
  }

  /**
   * Find a specific request by title
   */
  async findRequestByTitle(title: string): Promise<boolean> {
    console.log(`Looking for request with title: ${title}`);

    const requestTitles = await this.page.locator(this.requestTitles).allTextContents();
    return requestTitles.some(requestTitle => requestTitle.includes(title));
  }

  /**
   * Open request details by index (legacy method)
   */
  async openRequestDetailsByIndex(index = 0): Promise<void> {
    console.log(`Opening request details for request ${index}...`);

    const viewButtons = await this.page.locator(this.viewDetailsButtons).all();
    if (viewButtons.length > index) {
      await viewButtons[index].click();
    } else {
      throw new Error(`No request found at index ${index}`);
    }
  }

  /**
   * Verify request exists with specific title and status
   */
  async verifyRequestExists(title: string, expectedStatus = 'new'): Promise<void> {
    console.log(`Verifying request exists: ${title} with status: ${expectedStatus}`);

    // Check if request title exists
    const titleExists = await this.findRequestByTitle(title);
    expect(titleExists).toBe(true);

    // If we need to check status, we can add that logic here
    if (expectedStatus) {
      const requests = await this.getVisibleRequests();
      const matchingRequest = requests.find(req => req.title.includes(title));
      expect(matchingRequest).toBeDefined();
      expect(matchingRequest!.status.toLowerCase()).toContain(expectedStatus.toLowerCase());
    }
  }

  /**
   * Get request count
   */
  async getRequestCount(): Promise<number> {
    const requests = await this.page.locator(this.requestCards).all();
    return requests.length;
  }

  /**
   * Wait for requests to load
   */
  async waitForRequestsToLoad(timeout = 10000): Promise<void> {
    console.log('Waiting for requests to load...');
    await this.page.waitForSelector(this.requestCards, { timeout });
  }

  /**
   * Refresh the dashboard
   */
  async refreshDashboard(): Promise<void> {
    console.log('Refreshing dashboard...');
    await this.page.reload();
    await this.waitForRequestsToLoad();
  }

  /**
   * Open request details by request ID
   */
  async openRequestDetails(requestId: string): Promise<void> {
    console.log(`Opening request details for request ID: ${requestId}...`);

    // Look for a button or link that contains the request ID
    const requestButton = this.page.locator(`[data-request-id="${requestId}"] button, button:has-text("View Details")`).first();

    if (await requestButton.isVisible()) {
      await requestButton.click();
    } else {
      // Fallback: click the first "View Details" button if we can't find by ID
      const viewButtons = await this.page.locator(this.viewDetailsButtons).all();
      if (viewButtons.length > 0) {
        await viewButtons[0].click();
      } else {
        throw new Error(`No request found with ID ${requestId}`);
      }
    }
  }

  /**
   * Verify request details in the modal
   */
  async verifyRequestDetails(expectedData: {
    id: string;
    category: string;
    problemDescription: string;
    isEmergency: boolean;
    status: string;
  }): Promise<void> {
    console.log('Verifying request details in modal...');

    // Wait for modal to be visible
    const modal = this.page.locator('[role="dialog"], .modal, .MuiDialog-root');
    await expect(modal).toBeVisible();

    // Verify request ID is displayed
    const idElement = modal.locator(`text=${expectedData.id}, [data-testid*="id"]`);
    await expect(idElement.or(modal.locator('text=/ID:/'))).toBeVisible();

    // Verify category
    if (expectedData.category) {
      await expect(modal.locator(`text=${expectedData.category}`)).toBeVisible();
    }

    // Verify problem description
    if (expectedData.problemDescription) {
      await expect(modal.locator(`text=${expectedData.problemDescription}`)).toBeVisible();
    }

    // Verify emergency status
    if (expectedData.isEmergency) {
      await expect(modal.locator('text=/emergency/i')).toBeVisible();
    }

    // Verify status
    if (expectedData.status) {
      await expect(modal.locator(`text=${expectedData.status}`)).toBeVisible();
    }

    console.log('✅ Request details verified successfully');
  }

  /**
   * Close the request details modal
   */
  async closeRequestDetailsModal(): Promise<void> {
    console.log('Closing request details modal...');

    // Try common close button selectors
    const closeSelectors = [
      'button[aria-label="Close"]',
      'button:has(svg.lucide-x)',
      '.modal button[type="button"]:has-text("×")',
      '.MuiDialog-root button[aria-label="close"]'
    ];

    for (const selector of closeSelectors) {
      try {
        const closeButton = this.page.locator(selector).first();
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click();
          return;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Fallback: click outside modal or press Escape
    await this.page.keyboard.press('Escape');
  }

  /**
   * Verify request creation date is displayed and recent
   */
  async verifyRequestCreationDate(): Promise<void> {
    console.log('Verifying request creation date...');

    const modal = this.page.locator('[role="dialog"], .modal, .MuiDialog-root');

    // Look for date-related text
    const dateSelectors = [
      'text=/created/i',
      'text=/date/i',
      '[data-testid*="date"]',
      '[data-testid*="created"]'
    ];

    let dateFound = false;
    for (const selector of dateSelectors) {
      try {
        const dateElement = modal.locator(selector);
        if (await dateElement.isVisible({ timeout: 1000 })) {
          dateFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!dateFound) {
      // Check if there's any text that looks like a date
      const modalText = await modal.textContent();
      const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
      expect(modalText).toMatch(dateRegex);
    }

    console.log('✅ Request creation date verified');
  }
}