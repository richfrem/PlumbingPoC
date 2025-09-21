import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials } from '../helpers/auth';

test.describe('Customer Quote Creation Journey', () => {
  test('should complete full customer quote creation process', async ({ page }) => {
    // 1. Sign in as regular user
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // 2. Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // 3. Emergency triage - select "No"
    await page.getByRole('button', { name: 'No' }).click();

    // 4. Select service category - "Leak Repair"
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // === AI AGENT CONVERSATIONAL FLOW ===

    // Question 1: Property type (Material-UI Select dropdown)
    await page.getByLabel('What is the property type?').click();
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Question 2: Are you the homeowner? (Material-UI Select dropdown)
    await page.getByLabel('Are you the homeowner?').click();
    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Question 3: Problem description (textarea)
    await page.getByLabel('Please describe the general problem or need.').fill(
      'Water leaking from under kitchen sink. Slow drip that has been ongoing for a week.'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Question 4: Preferred timing (text input)
    await page.getByRole('textbox').fill('ASAP - this week if possible');
    await page.getByRole('button', { name: 'Send' }).click();

    // Question 5: Additional notes (textarea)
    await page.getByLabel('Additional notes (specify "none" if not applicable):').fill(
      'The leak is in the main kitchen. Access is available during business hours.'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // === AI FOLLOW-UP QUESTIONS ===

    // AI Question 1: Leak location
    await page.getByRole('textbox').fill('Under the kitchen sink cabinet');
    await page.getByRole('button', { name: 'Send' }).click();

    // AI Question 2: Leak severity
    await page.getByRole('textbox').fill('Slow but steady drip');
    await page.getByRole('button', { name: 'Send' }).click();

    // === QUOTE SUBMISSION ===

    // Wait for summary to appear
    await expect(page.getByText('Please confirm your details:')).toBeVisible();

    // Verify all information is displayed correctly
    await expect(page.getByText('Leak Repair')).toBeVisible();
    await expect(page.getByText('Water leaking from under kitchen sink')).toBeVisible();
    await expect(page.getByText('Residential')).toBeVisible();
    await expect(page.getByText('Yes')).toBeVisible();

    // 4. Click "Confirm & Submit Request" button
    await page.getByRole('button', { name: 'Confirm & Submit Request' }).click();

    // Verify successful submission
    await expect(page.getByText('Thank you!')).toBeVisible();
    await expect(page.getByText('Your quote request has been submitted')).toBeVisible();

    console.log('✅ Customer quote creation journey completed successfully!');
  });

  test('should handle emergency quote creation', async ({ page }) => {
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Click "Request a Quote"
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "Yes, it's an emergency"
    await page.getByRole('button', { name: 'Yes, it\'s an emergency' }).click();

    // Select service category
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // Emergency flow - should prioritize urgency
    await page.getByLabel('What is the property type?').click();
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByLabel('Are you the homeowner?').click();
    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency description
    await page.getByLabel('Please describe the general problem or need.').fill(
      'EMERGENCY: Water flooding kitchen floor from burst pipe!'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency timing
    await page.getByRole('textbox').fill('EMERGENCY - Need immediate response');
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency notes
    await page.getByLabel('Additional notes (specify "none" if not applicable):').fill(
      'Water is actively flooding. Main water valve location: basement utility room.'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // AI follow-up for emergency
    await page.getByRole('textbox').fill('Under kitchen sink - burst pipe spraying water');
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByRole('textbox').fill('Severe - water spraying everywhere');
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify emergency flag is displayed
    await expect(page.getByText('EMERGENCY REQUEST')).toBeVisible();

    // Submit emergency request
    await page.getByRole('button', { name: 'Confirm & Submit Request' }).click();
    await expect(page.getByText('Thank you!')).toBeVisible();

    console.log('✅ Emergency quote creation completed successfully!');
  });

  test('should handle different service categories', async ({ page }) => {
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    await page.getByRole('button', { name: 'Request a Quote' }).click();
    await page.getByRole('button', { name: 'No' }).click();

    // Test Bathroom Renovation category
    await page.getByRole('button', { name: 'Bathroom Renovation' }).click();

    // Answer questions for bathroom renovation
    await page.getByLabel('What is the property type?').click();
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByLabel('Are you the homeowner?').click();
    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByLabel('Please describe the general problem or need.').fill(
      'Complete bathroom renovation including new fixtures and plumbing'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByRole('textbox').fill('Within 2-3 weeks');
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByLabel('Additional notes (specify "none" if not applicable):').fill(
      'Keep existing layout but upgrade all fixtures'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify bathroom renovation category is selected
    await expect(page.getByText('Bathroom Renovation')).toBeVisible();

    console.log('✅ Different service category test completed successfully!');
  });
});