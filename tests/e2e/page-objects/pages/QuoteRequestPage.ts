import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for quote request functionality
 */
export class QuoteRequestPage extends BasePage {
  // Selectors
  private requestQuoteButton = 'button:has-text("Request a Quote")';
  private emergencyYesButton = 'button:has-text("Yes, it\'s an emergency")';
  private emergencyNoButton = 'button:has-text("No")';
  private serviceCategoryButtons = {
    leakRepair: 'button:has-text("Leak Repair")',
    bathroomRenovation: 'button:has-text("Bathroom Renovation")'
  };
  private submitButton = 'button:has-text("Submit")';
  private modalDialog = '[role="dialog"]';
  private myQuoteRequestsSection = 'text="My Quote Requests"';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the quote request modal
   */
  async openQuoteRequestModal(): Promise<void> {
    console.log('Opening quote request modal...');
    await this.page.locator(this.requestQuoteButton).click();
    await this.waitForElement(this.modalDialog);
  }

  /**
   * Handle emergency triage
   */
  async selectEmergencyOption(isEmergency: boolean): Promise<void> {
    const buttonText = isEmergency ? 'Yes, it\'s an emergency' : 'No';
    console.log(`Selecting emergency option: ${buttonText}`);

    await this.page.locator(`button:has-text("${buttonText}")`).click();
  }

  /**
   * Select service category
   */
  async selectServiceCategory(category: 'leak_repair' | 'bathroom_renovation'): Promise<void> {
    const categoryMap = {
      leak_repair: 'Leak Repair',
      bathroom_renovation: 'Bathroom Renovation'
    };

    const categoryText = categoryMap[category];
    console.log(`Selecting service category: ${categoryText}`);

    await this.page.locator(`button:has-text("${categoryText}")`).click();
  }

  /**
   * Fill out the basic quote request form
   */
  async fillBasicQuoteForm(data: {
    propertyType: 'Residential' | 'Apartment' | 'Commercial' | 'Other';
    isHomeowner: boolean;
    problemDescription: string;
    preferredTiming: string;
    additionalNotes: string;
  }): Promise<void> {
    console.log('Filling out basic quote form...');

    // Property type
    await this.page.getByText('What is the property type?').waitFor();
    await this.page.locator('.MuiSelect-select').first().click();
    await this.page.getByRole('option', { name: data.propertyType }).click();
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Homeowner status
    await this.page.getByText('Are you the homeowner?').waitFor();
    await this.page.locator('div[role="combobox"]').first().waitFor({ timeout: 10000 });
    await this.page.locator('div[role="combobox"]').first().click();
    await this.page.getByRole('option', { name: data.isHomeowner ? 'Yes' : 'No' }).click();
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Problem description
    await this.page.getByText('Please describe the general problem or need.').waitFor();
    await this.page.getByPlaceholder('Type your answer...').fill(data.problemDescription);
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Preferred timing
    await this.page.getByText('What is your preferred timing').waitFor();
    await this.page.getByPlaceholder('Type your answer...').fill(data.preferredTiming);
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Additional notes
    await this.page.getByText('Additional notes').waitFor();
    await this.page.getByPlaceholder('Type your answer...').fill(data.additionalNotes);
    await this.page.getByRole('button', { name: 'Send' }).click();

    console.log('✅ Basic form filled successfully');
  }

  /**
   * Submit the quote request
   */
  async submitQuoteRequest(): Promise<void> {
    console.log('Submitting quote request...');

    // Wait for submit button and click
    await this.page.locator(this.submitButton).first().waitFor({ timeout: 30000, state: 'visible' });
    console.log('✅ Found submit button, clicking...');

    await this.page.locator(this.submitButton).first().click({ force: true });
  }

  /**
   * Wait for API submission response
   */
  async waitForSubmissionResponse(): Promise<any> {
    console.log('Waiting for API submission response...');

    const response = await this.waitForApiResponse('/api/requests/submit', 201, 30000);
    const responseData = await response.json();

    console.log('✅ API submission successful!');
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    return responseData;
  }

  /**
   * Verify modal closes after submission
   */
  async verifyModalClosed(): Promise<void> {
    console.log('Verifying modal closes...');

    await this.page.waitForTimeout(2000); // Give time for modal to close
    await expect(this.page.locator(this.modalDialog)).toHaveCount(0);
  }

  /**
   * Verify we're back on the main page
   */
  async verifyOnMainPage(): Promise<void> {
    console.log('Verifying on main page...');

    await expect(this.page.locator(this.myQuoteRequestsSection)).toBeVisible();
  }

  /**
   * Complete quote request workflow
   */
  async createQuoteRequest(options: {
    isEmergency: boolean;
    category: 'leak_repair' | 'bathroom_renovation';
    formData: {
      propertyType: 'Residential' | 'Apartment' | 'Commercial' | 'Other';
      isHomeowner: boolean;
      problemDescription: string;
      preferredTiming: string;
      additionalNotes: string;
    };
  }): Promise<any> {
    console.log('🚀 Starting quote request creation workflow...');

    // Open modal
    await this.openQuoteRequestModal();

    // Emergency triage
    await this.selectEmergencyOption(options.isEmergency);

    // Service category
    await this.selectServiceCategory(options.category);

    // Fill form
    await this.fillBasicQuoteForm(options.formData);

    // Submit and wait for API response
    await this.submitQuoteRequest();
    const responseData = await this.waitForSubmissionResponse();

    // Verify completion
    await this.verifyModalClosed();
    await this.verifyOnMainPage();

    console.log('✅ Quote request creation completed successfully!');
    return responseData;
  }
}