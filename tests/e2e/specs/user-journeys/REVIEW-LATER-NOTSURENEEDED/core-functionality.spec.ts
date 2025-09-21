import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials } from './helpers/auth';

test.describe('Core Functionality', () => {
  test('user can login successfully', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await page.goto('/');
    await signInForTest(page, email, password);

    // Verify we're logged in - should see user menu or dashboard access
    await expect(page.locator('button:has(svg.lucide-chevron-down)').first()).toBeVisible();

    console.log('✅ User login test passed');
  });

  test('user can submit basic quote request', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await page.goto('/');
    await signInForTest(page, email, password);

    // Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "No" (not an emergency)
    await page.getByRole('button', { name: 'No' }).click();

    // Select service category - "Leak Repair"
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // Basic property type selection
    await page.waitForTimeout(2000); // Wait for AI agent to process
    await page.getByText('What is the property type?').first().waitFor();

    await page.locator('.MuiSelect-select').first().click();
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic homeowner question
    await page.getByText('Are you the homeowner?').first().waitFor();
    await page.waitForTimeout(3000);

    await page.locator('div[role="combobox"]').first().waitFor({ timeout: 10000 });
    await page.locator('div[role="combobox"]').first().click();
    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic problem description
    await page.getByText('Please describe the general problem or need.').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill('Kitchen sink leak under the cabinet');
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic timing preference
    await page.getByText('What is your preferred timing').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill('This week');
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic additional notes
    await page.getByText('Additional notes').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill('Access available during business hours');
    await page.getByRole('button', { name: 'Send' }).click();

    // Handle potential AI follow-up questions or direct summary
    await page.waitForTimeout(5000);

    // Submit the request
    const submitButton = page.locator('button').filter({ hasText: 'Submit' }).first();
    await submitButton.waitFor({ timeout: 30000, state: 'visible' });

    // Start waiting for the API call before clicking
    const apiCallPromise = page.waitForResponse(response =>
      response.url().includes('/api/requests/submit') && response.status() === 201
    );

    await submitButton.click({ force: true });

    // Wait for the API call to complete successfully
    const apiResponse = await apiCallPromise;

    // Verify the response
    const responseData = await apiResponse.json();
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    // Verify modal closes and we're back to main page
    await page.waitForTimeout(2000);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.getByText('My Quote Requests')).toBeVisible();

    console.log('✅ Basic quote request submission test passed');
  });
});