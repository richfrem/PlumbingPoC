import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for user profile functionality
 */
export class ProfilePage extends BasePage {
  // Selectors for modal-based profile (Material-UI components)
  private profileHeading = 'h5:has-text("Update Your Profile")';
  private nameInput = 'input[aria-label="Name"]'; // Name field
  private emailInput = 'input[aria-label="Email"]'; // Email field (disabled)
  private phoneInput = 'input[aria-label="Phone Number"]'; // Phone field
  private provinceSelect = '[role="combobox"]'; // Province select
  private cityInput = 'input[aria-label="City"]'; // City field
  private addressInput = 'input[aria-label="Address"]'; // Address field
  private postalCodeInput = 'input[aria-label="Postal Code"]'; // Postal code field
  private saveButton = 'button:has-text("Save Profile")';

  // Legacy modal selectors (kept for compatibility)
  private profileButton = 'button:has(svg.lucide-user)';
  private profileModal = '[role="dialog"]';
  private cancelButton = 'button:has-text("Cancel")';
  private closeButton = 'button[aria-label="Close"], button:has(svg.lucide-x)';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the profile modal
   */
  async openProfileModal(): Promise<void> {
    console.log('Opening profile modal...');
    await this.page.locator(this.profileButton).click();
    await this.waitForElement(this.profileModal);
  }

  /**
   * Fill out the profile form
   */
  async fillProfileForm(profileData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<void> {
    console.log('Filling profile form...');

    // Wait for modal to be ready
    await this.waitForElement(this.profileHeading);

    // Use more direct selectors for Material-UI TextField components
    const textFields = this.page.locator('.MuiTextField-root input:not([disabled])');
    const inputs = await textFields.all();

    if (inputs.length >= 5) {
      // Fill fields by index (more reliable than trying to match specific selectors)
      await inputs[0].fill(profileData.name); // Name
      await inputs[1].fill(profileData.phone); // Phone (email is disabled)
      await inputs[2].fill(profileData.city); // City
      await inputs[3].fill(profileData.address); // Address
      await inputs[4].fill(profileData.postalCode); // Postal Code
    }

    // Handle province select
    const provinceSelect = this.page.locator('[role="combobox"]');
    await provinceSelect.click();
    await this.page.locator(`[data-value="${profileData.province}"]`).click();

    console.log('✅ Profile form filled successfully');
  }

  /**
   * Save the profile
   */
  async saveProfile(): Promise<void> {
    console.log('Saving profile...');
    await this.page.locator(this.saveButton).click();
  }

  /**
   * Cancel profile changes
   */
  async cancelProfile(): Promise<void> {
    console.log('Canceling profile changes...');
    await this.page.locator(this.cancelButton).click();
  }

  /**
   * Close the profile modal
   */
  async closeProfileModal(): Promise<void> {
    console.log('Closing profile modal...');
    await this.page.locator(this.closeButton).first().click();
  }

  /**
   * Get current profile data from form
   */
  async getProfileFormData(): Promise<{
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  }> {
    console.log('Getting profile form data...');

    return {
      name: await this.page.locator(this.nameInput).inputValue() || '',
      email: await this.page.locator(this.emailInput).inputValue() || '',
      phone: await this.page.locator(this.phoneInput).inputValue() || '',
      address: await this.page.locator(this.addressInput).inputValue() || '',
      city: await this.page.locator(this.cityInput).inputValue() || '',
      province: await this.page.locator(this.provinceSelect).inputValue() || '',
      postalCode: await this.page.locator(this.postalCodeInput).inputValue() || ''
    };
  }

  /**
   * Verify profile modal is open
   */
  async verifyProfileModalOpen(): Promise<void> {
    console.log('Verifying profile modal is open...');
    await expect(this.page.locator(this.profileModal)).toBeVisible();
  }

  /**
   * Verify profile modal is closed
   */
  async verifyProfileModalClosed(): Promise<void> {
    console.log('Verifying profile modal is closed...');
    await expect(this.page.locator(this.profileModal)).not.toBeVisible();
  }

  /**
   * Complete profile creation/update workflow
   */
  async createOrUpdateProfile(profileData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<void> {
    console.log('🚀 Starting profile creation/update workflow...');

    // Open profile modal
    await this.openProfileModal();

    // Fill form
    await this.fillProfileForm(profileData);

    // Save profile
    await this.saveProfile();

    // Verify modal closes
    await this.verifyProfileModalClosed();

    console.log('✅ Profile creation/update completed successfully');
  }

  /**
   * Verify profile data matches expected values
   */
  async verifyProfileData(expectedData: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  }>): Promise<void> {
    console.log('Verifying profile data...');

    // Open profile modal to check data
    await this.openProfileModal();

    // Get current form data
    const formData = await this.getProfileFormData();

    // Verify each expected field
    if (expectedData.name) {
      expect(formData.name).toBe(expectedData.name);
    }
    if (expectedData.email) {
      expect(formData.email).toBe(expectedData.email);
    }
    if (expectedData.phone) {
      expect(formData.phone).toBe(expectedData.phone);
    }
    if (expectedData.address) {
      expect(formData.address).toBe(expectedData.address);
    }
    if (expectedData.city) {
      expect(formData.city).toBe(expectedData.city);
    }
    if (expectedData.province) {
      expect(formData.province).toBe(expectedData.province);
    }
    if (expectedData.postalCode) {
      expect(formData.postalCode).toBe(expectedData.postalCode);
    }

    // Close modal
    await this.closeProfileModal();

    console.log('✅ Profile data verification completed');
  }

  /**
   * Verify profile modal is loaded
   */
  async verifyProfilePageLoaded(): Promise<void> {
    console.log('Verifying profile modal is loaded...');
    await expect(this.page.locator(this.profileHeading)).toBeVisible();
    await expect(this.page.locator(this.nameInput)).toBeVisible();
    await expect(this.page.locator(this.emailInput)).toBeVisible();
    await expect(this.page.locator(this.phoneInput)).toBeVisible();
    await expect(this.page.locator(this.saveButton)).toBeVisible();
    console.log('✅ Profile modal verification completed');
  }
}
