import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials } from '../helpers/auth';

test.describe('Emergency Leak Conversational Flow', () => {
  test('should complete full emergency leak scenario from start to quote submission', async ({ page }) => {
    // Get test credentials
    const { email, password } = getTestCredentials();

    // Navigate to the application
    await page.goto('/');

    // Sign in first
    const loginSuccess = await signInForTest(page, email, password);
    expect(loginSuccess).toBe(true);

    // Verify we're on the home page
    await expect(page).toHaveTitle(/AquaFlow Plumbing/);

    // Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage step
    await expect(page.getByText('Is this an emergency?')).toBeVisible();
    await page.getByRole('button', { name: 'Yes, it\'s an emergency' }).click();

    // Service category selection
    await expect(page.getByText('What would you like a quote for?')).toBeVisible();
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // Answer initial questions
    await expect(page.getByText('What is the property type?')).toBeVisible();
    await page.getByRole('button', { name: 'House' }).click();

    await expect(page.getByText('Are you the homeowner?')).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();

    // Problem description
    await expect(page.getByText('Please describe the general problem.')).toBeVisible();
    await page.getByLabel('Please describe the general problem.').fill('Water is pouring from the ceiling in the kitchen');

    await page.getByRole('button', { name: 'Send' }).click();

    // AI follow-up questions (wait for AI response)
    await expect(page.getByText(/When did you first notice the leak?/)).toBeVisible();

    // Answer follow-up questions
    await page.getByRole('textbox').fill('About 2 hours ago');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText(/How severe is the leak?/)).toBeVisible();
    await page.getByRole('textbox').fill('Water is actively pouring out');
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for AI processing and summary
    await expect(page.getByText('Please confirm your details:')).toBeVisible();

    // Verify emergency flag is displayed
    await expect(page.getByText('EMERGENCY REQUEST')).toBeVisible();

    // Verify service type
    await expect(page.getByText('Leak Repair')).toBeVisible();

    // Submit the quote request
    await page.getByRole('button', { name: 'Confirm & Submit Request' }).click();

    // Verify submission success
    await expect(page.getByText('Thank you!')).toBeVisible();
    await expect(page.getByText('Your quote request has been submitted.')).toBeVisible();
  });

  test('should handle user canceling emergency flow', async ({ page }) => {
    await page.goto('/');

    // Start quote request
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage
    await page.getByRole('button', { name: 'Yes, it\'s an emergency' }).click();

    // Close modal
    await page.getByRole('button', { name: /close/i }).click();

    // Verify we're back to home page
    await expect(page.getByText('Professional Plumbing Services')).toBeVisible();
  });
});