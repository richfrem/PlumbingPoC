import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials } from '../helpers/auth';

test.describe('Standard Service Request Conversational Flow', () => {
  test('should complete full standard service request from start to quote submission', async ({ page }) => {
    // Get test credentials
    const { email, password } = getTestCredentials();

    // Navigate to the application
    await page.goto('/');

    // Sign in first
    const loginSuccess = await signInForTest(page, email, password);
    expect(loginSuccess).toBe(true);

    // Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "No"
    await expect(page.getByText('Is this an emergency?')).toBeVisible();
    await page.getByRole('button', { name: 'No' }).click();

    // Service category selection
    await expect(page.getByText('What would you like a quote for?')).toBeVisible();
    await page.getByRole('button', { name: 'Bathroom Renovation' }).click();

    // Answer initial questions
    await expect(page.getByText('What is the property type?')).toBeVisible();
    await page.getByRole('button', { name: 'House' }).click();

    await expect(page.getByText('Are you the homeowner?')).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();

    // Problem description
    await expect(page.getByText('Please describe the general problem.')).toBeVisible();
    await page.getByLabel('Please describe the general problem.').fill('I want to renovate my bathroom with new fixtures');

    await page.getByRole('button', { name: 'Send' }).click();

    // AI follow-up questions for bathroom renovation
    await expect(page.getByText(/Are you changing the plumbing layout/)).toBeVisible();
    await page.getByRole('button', { name: 'No' }).click();

    await expect(page.getByText(/Are you replacing the main shower/)).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();

    // Wait for summary
    await expect(page.getByText('Please confirm your details:')).toBeVisible();

    // Verify service type
    await expect(page.getByText('Bathroom Renovation')).toBeVisible();

    // Submit the quote request
    await page.getByRole('button', { name: 'Confirm & Submit Request' }).click();

    // Verify submission success
    await expect(page.getByText('Thank you!')).toBeVisible();
    await expect(page.getByText('Your quote request has been submitted.')).toBeVisible();
  });

  test('should handle complex AI follow-up questions for other category', async ({ page }) => {
    await page.goto('/');

    // Start quote request
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // No emergency
    await page.getByRole('button', { name: 'No' }).click();

    // Select "Other" category
    await page.getByRole('button', { name: 'Other (Describe Your Request)' }).click();

    // Answer basic questions
    await page.getByRole('button', { name: 'House' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();

    // Complex problem description that should trigger AI
    await page.getByLabel('Please describe the general problem.').fill('Weird gurgling noise from pipes when water runs, not sure what it means');
    await page.getByRole('button', { name: 'Send' }).click();

    // AI should generate follow-up questions
    await expect(page.locator('text=/When does the noise occur/')).toBeVisible();

    // Answer AI questions
    await page.getByRole('textbox').fill('When any faucet is turned on');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('text=/What type of noise/')).toBeVisible();
    await page.getByRole('textbox').fill('Gurgling and bubbling sound');
    await page.getByRole('button', { name: 'Send' }).click();

    // Should reach summary
    await expect(page.getByText('Please confirm your details:')).toBeVisible();
  });
});