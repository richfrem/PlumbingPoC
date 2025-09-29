import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';

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

  // --- ADD THESE NEW SELECTORS ---
  private readonly adminCommandCenterHeading = this.page.getByRole('heading', { name: "Plumber's Command Center" });
  private readonly adminCommandCenterText = this.page.getByText("Plumber's Command Center");
  private readonly dataGrid = this.page.locator('.MuiDataGrid-root');
  private readonly tableModeButton = this.page.getByRole('button', { name: 'Table' });
  private readonly mapModeButton = this.page.getByRole('button', { name: 'Map' });
  private readonly emergencyOnlyToggle = this.page.getByLabel('Emergencies Only');
  private readonly requestDetailModal = this.page.getByText(/Job Docket:/).locator('xpath=./ancestor::div[1]');

  constructor(page: Page) {
    super(page);
  }

  // --- ADD THESE NEW METHODS FOR DATAGRID UI ---

  /**
   * [NEW] Clicks a status filter chip in the filter bar.
   * @param status The status to filter by (e.g., 'New', 'Quoted', 'All Requests').
   */
  async filterByStatus(status: 'All Requests' | 'New' | 'Viewed' | 'Quoted' | 'Accepted' | 'Scheduled' | 'Completed'): Promise<void> {
    console.log(`Filtering dashboard by status: "${status}"...`);
    const filterChip = this.page.getByRole('button', { name: status, exact: true });
    await filterChip.click();
    await this.page.waitForTimeout(500); // Small pause for UI to settle
  }

  /**
   * [NEW] Toggles the "Emergencies Only" switch.
   */
  async toggleEmergencyFilter(): Promise<void> {
    console.log('Toggling the "Emergencies Only" filter...');
    await this.emergencyOnlyToggle.click();
    await this.page.waitForTimeout(500); // Small pause for UI to settle
  }

  /**
   * [NEW] Switches the view to the Table mode.
   */
  async switchToTableView(): Promise<void> {
    console.log('Switching to Table view...');
    await this.tableModeButton.click();
    await expect(this.dataGrid).toBeVisible();
  }

  /**
   * [NEW] Switches the view to the Map mode.
   */
  async switchToMapView(): Promise<void> {
    console.log('Switching to Map view...');
    await this.mapModeButton.click();
    await expect(this.page.getByText('Keyboard shortcuts')).toBeVisible();
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
   * [UPDATED] Verify we're on the admin dashboard
   */
  async verifyOnAdminDashboard(): Promise<void> {
    console.log('Verifying on admin dashboard...');
    // Try heading selector first, fallback to text selector
    try {
      await expect(this.adminCommandCenterHeading).toBeVisible({ timeout: 5000 });
    } catch (error) {
      console.log('Heading selector failed, trying text selector...');
      await expect(this.adminCommandCenterText).toBeVisible({ timeout: 5000 });
    }
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
   * [UPDATED] Wait for requests to load
   */
  async waitForRequestsToLoad(timeout = 10000): Promise<void> {
    console.log('Waiting for requests to load...');
    // Updated to check for DataGrid rows, which is more reliable than the old card selector
    await this.page.locator('[role="row"][data-request-id]').first().waitFor({ timeout });
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
   * [UPDATED] Verify request details in the modal
   */
  async verifyRequestDetails(expectedData: {
    id: string;
    category: string;
    problemDescription: string;
    isEmergency: boolean;
    status: string;
  }): Promise<void> {
    console.log('Verifying request details in modal...');
    const modal = this.requestDetailModal;
    await expect(modal).toBeVisible();

    // Updated locators to be more specific to the new modal structure
    await expect(modal.getByText(`ID: ${expectedData.id}`)).toBeVisible();
    if (expectedData.category) {
      await expect(modal.getByText(expectedData.category, { exact: false })).toBeVisible();
    }
    if (expectedData.problemDescription) {
        await expect(modal.getByText(expectedData.problemDescription)).toBeVisible();
    }
    if (expectedData.isEmergency) {
        // Look for the "EMERGENCY" chip/text
        await expect(modal.locator(':text("Emergency"), :text("EMERGENCY")')).toBeVisible();
    }
    if (expectedData.status) {
        // Find the "Status" label and get its sibling element for the value
        const statusField = modal.getByText('Status').locator('xpath=./following-sibling::*');
        await expect(statusField).toHaveText(expectedData.status, { ignoreCase: true });
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
   * [UPDATED] Verify request creation date is displayed and recent
   */
  async verifyRequestCreationDate(): Promise<void> {
    console.log('Verifying request creation date...');
    const modal = this.requestDetailModal;
    const subtitle = modal.locator('p:has-text("Received:")');
    await expect(subtitle).toBeVisible();
    const subtitleText = await subtitle.textContent();
    // This regex matches the format in the UI screenshot (e.g., "9/24/2025, 11:32:10 AM")
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M/i;
    expect(subtitleText).toMatch(dateRegex);
    console.log('✅ Request creation date verified');
  }

  /**
   * BUILDING BLOCK: Navigate dashboard table and find a specific request.
   * Scrolls through the dashboard table to locate a request by ID.
   * @param requestId The ID of the request to find.
   * @param userType The type of dashboard ('user' or 'admin').
   */
  async navigateToRequestInTable(requestId: string, userType: 'user' | 'admin'): Promise<void> {
    console.log(`Navigating dashboard table to find request ${requestId}...`);

    const locator = userType === 'admin'
      ? `div[data-request-id="${requestId}"]`
      : `button[data-request-id="${requestId}"]`;

    // Wait for the table to load and find the specific request
    const requestRow = this.page.locator(locator);
    await requestRow.waitFor({ state: 'visible', timeout: 20000 });

    // Scroll the element into view if needed
    await requestRow.scrollIntoViewIfNeeded();

    console.log(`✅ Found request ${requestId} in dashboard table.`);
  }

  /**
   * BUILDING BLOCK: Finds and opens a request modal from a dashboard.
   * @param requestId The ID of the request to find.
   * @param userType The type of dashboard to look on ('user' or 'admin').
   */
  async findAndOpenRequest(requestId: string, userType: 'user' | 'admin'): Promise<void> {
    console.log(`Finding request ${requestId} on the ${userType} dashboard...`);
    const locator = userType === 'admin'
        ? `div[data-request-id="${requestId}"]`
        : `button[data-request-id="${requestId}"]`;

    const requestRow = this.page.locator(locator);
    await requestRow.waitFor({ state: 'visible', timeout: 20000 });
    await requestRow.click();
    await expect(this.page.getByText(/Job Docket:/)).toBeVisible();
    console.log('✅ Found and opened request modal.');
  }

  /**
   * BUILDING BLOCK: Open a specific quote request by ID from dashboard.
   * Combines navigation and opening into a single action.
   * @param requestId The ID of the request to open.
   * @param userType The type of dashboard ('user' or 'admin').
   */
  async openRequestById(requestId: string, userType: 'user' | 'admin'): Promise<void> {
    console.log(`Opening request ${requestId} from ${userType} dashboard...`);

    // First navigate to the request in the table
    await this.navigateToRequestInTable(requestId, userType);

    // Then click to open it
    const locator = userType === 'admin'
      ? `div[data-request-id="${requestId}"]`
      : `button[data-request-id="${requestId}"]`;

    const requestRow = this.page.locator(locator);
    await requestRow.click();

    // Wait for the modal to open
    await expect(this.page.getByText(/Job Docket:/)).toBeVisible();

    console.log(`✅ Successfully opened request ${requestId}.`);
  }
}