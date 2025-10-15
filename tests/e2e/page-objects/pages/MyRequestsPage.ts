import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { logger } from '../../../../packages/frontend/src/lib/logger';


/**
 * Page object for user "My Requests" functionality
 */
export class MyRequestsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * BUILDING BLOCK: Navigate to a specific user request in the My Requests list.
   * Finds and scrolls to a request by ID in the user's My Requests section.
   * @param requestId The ID of the request to find.
   */
  async navigateToUserRequestInList(requestId: string): Promise<void> {
    logger.log(`Navigating to user request ${requestId} in My Requests list...`);

    // User requests are typically buttons with data-request-id attributes
    const requestButton = this.page.locator(`button[data-request-id="${requestId}"]`);
    await requestButton.waitFor({ state: 'visible', timeout: 20000 });

    // Scroll the element into view if needed
    await requestButton.scrollIntoViewIfNeeded();

    logger.log(`✅ Found user request ${requestId} in My Requests list.`);
  }

  /**
   * BUILDING BLOCK: Open a specific user request by ID from My Requests.
   * Finds and opens a request from the user's My Requests section.
   * @param requestId The ID of the request to open.
   */
  async openUserRequestById(requestId: string): Promise<void> {
    logger.log(`Opening user request ${requestId} from My Requests...`);

    // First navigate to the request in the list
    await this.navigateToUserRequestInList(requestId);

    // Then click to open it
    const requestButton = this.page.locator(`button[data-request-id="${requestId}"]`);
    await requestButton.click();

    // Wait for the request details modal to open
    await expect(this.page.getByText(/Job Docket:/)).toBeVisible();

    logger.log(`✅ Successfully opened user request ${requestId}.`);
  }

  /**
   * BUILDING BLOCK: View detailed information for a user request.
   * Opens a request and verifies all key details are displayed.
   * @param requestId The ID of the request to view details for.
   * @param expectedDetails Optional object with expected details to verify.
   */
  async viewUserRequestDetails(requestId: string, expectedDetails?: {
    serviceType?: string;
    status?: string;
    hasAttachments?: boolean;
    hasQuotes?: boolean;
  }): Promise<void> {
    logger.log(`Viewing detailed information for user request ${requestId}...`);

    // Open the request first
    await this.openUserRequestById(requestId);

    // Verify we're in the request details view
    await expect(this.page.getByText(/Job Docket:/)).toBeVisible();

    // Verify key sections are present
    const problemDetailsSection = this.page.locator('[data-testid="problem-details"], .problem-details');
    const communicationLogSection = this.page.locator('[data-testid="communication-log"], .communication-log');
    const attachmentsSection = this.page.locator('[data-testid="attachments"], .attachments');

    // Check if sections exist (they might not be visible if empty)
    const hasProblemDetails = await problemDetailsSection.count() > 0;
    const hasCommunicationLog = await communicationLogSection.count() > 0;
    const hasAttachments = await attachmentsSection.count() > 0;

    logger.log(`📋 Request details sections available:`);
    logger.log(`   - Problem Details: ${hasProblemDetails}`);
    logger.log(`   - Communication Log: ${hasCommunicationLog}`);
    logger.log(`   - Attachments: ${hasAttachments}`);

    // Verify expected details if provided
    if (expectedDetails) {
      if (expectedDetails.serviceType) {
        await expect(this.page.getByText(expectedDetails.serviceType)).toBeVisible();
      }
      if (expectedDetails.status) {
        await expect(this.page.getByText(expectedDetails.status, { exact: false })).toBeVisible();
      }
      if (expectedDetails.hasAttachments) {
        // Check for attachment indicators
        const attachmentIndicators = this.page.locator('[data-testid*="attachment"], .attachment, .file-attachment');
        expect(await attachmentIndicators.count()).toBeGreaterThan(0);
      }
      if (expectedDetails.hasQuotes) {
        // Check for quote indicators
        const quoteIndicators = this.page.locator('[data-testid*="quote"], .quote, .pricing');
        expect(await quoteIndicators.count()).toBeGreaterThan(0);
      }
    }

    logger.log(`✅ Successfully viewed details for user request ${requestId}.`);
  }
}
