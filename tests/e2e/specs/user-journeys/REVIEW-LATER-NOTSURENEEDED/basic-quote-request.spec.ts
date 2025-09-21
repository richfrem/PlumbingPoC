import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials } from '../helpers/auth';

test.describe('Basic Quote Request Creation', () => {
  test('should create a basic quote request', async ({ page }) => {
    // Sign in as regular user
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "No" (not an emergency)
    await page.getByRole('button', { name: 'No' }).click();

    // Select service category - "Leak Repair"
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // Basic property type selection - wait for the question to appear
    await page.waitForTimeout(2000); // Wait for AI agent to process
    await page.getByText('What is the property type?').first().waitFor();

    // Click on the select element directly using Material-UI classes
    await page.locator('.MuiSelect-select').first().click();

    // Select the Residential option
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic homeowner question - wait for it to appear and find the associated select
    await page.getByText('Are you the homeowner?').first().waitFor();
    await page.waitForTimeout(3000); // Give more time for the select to render

    // Wait for any combobox to be available and click the first one
    await page.locator('div[role="combobox"]').first().waitFor({ timeout: 10000 });
    await page.locator('div[role="combobox"]').first().click();

    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic problem description - wait for the text input to appear
    await page.getByText('Please describe the general problem or need.').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill(
      'Kitchen sink leak under the cabinet'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic timing preference - wait for the question to appear
    await page.getByText('What is your preferred timing').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill('This week');
    await page.getByRole('button', { name: 'Send' }).click();

    // Basic additional notes - wait for the question to appear
    await page.getByText('Additional notes').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill(
      'Access available during business hours'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Handle potential AI follow-up questions or direct summary
    await page.waitForTimeout(5000); // Give AI time to process

    // Use the working Strategy 3: Find button with "Submit" text
    console.log('Looking for submit button...');
    const submitButton = page.locator('button').filter({ hasText: 'Submit' }).first();

    await submitButton.waitFor({ timeout: 30000, state: 'visible' });
    console.log('✅ Found submit button, clicking with force...');

    // Start waiting for the API call before clicking
    const apiCallPromise = page.waitForResponse(response =>
      response.url().includes('/api/requests/submit') && response.status() === 201
    );

    await submitButton.click({ force: true });

    // Wait for the API call to complete successfully
    console.log('Waiting for API submission response...');
    const apiResponse = await apiCallPromise;
    console.log('✅ API submission successful!');

    // Verify the response contains the expected data
    const responseData = await apiResponse.json();
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    // Verify successful submission - modal should close automatically
    // Wait for modal to close (the modal root should disappear)
    await page.waitForTimeout(2000); // Give time for modal to close

    // Verify we're back to the main page (modal should be gone)
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // Verify the "My Quote Requests" section is visible (indicating successful navigation)
    await expect(page.getByText('My Quote Requests')).toBeVisible();

    console.log('✅ Basic quote request creation completed successfully!');

    console.log('✅ Basic quote request creation completed successfully!');
  });

  test('should create emergency quote request', async ({ page }) => {
    // Sign in as regular user
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "Yes, it's an emergency"
    await page.getByRole('button', { name: 'Yes, it\'s an emergency' }).click();

    // Select service category - "Leak Repair"
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // Emergency property type
    await page.waitForTimeout(2000); // Wait for AI agent to process
    await page.getByText('What is the property type?').first().waitFor();

    await page.locator('.MuiSelect-select').first().click();
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency homeowner question
    await page.getByText('Are you the homeowner?').first().waitFor();
    await page.waitForTimeout(3000); // Give more time for the select to render

    await page.locator('div[role="combobox"]').first().waitFor({ timeout: 10000 });
    await page.locator('div[role="combobox"]').first().click();

    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency description - wait for the text input to appear
    await page.getByText('Please describe the general problem or need.').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill(
      'EMERGENCY: Water flooding kitchen floor from burst pipe!'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency timing - wait for the question to appear
    await page.getByText('What is your preferred timing').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill('EMERGENCY - Immediate response needed');
    await page.getByRole('button', { name: 'Send' }).click();

    // Emergency notes - wait for the question to appear
    await page.getByText('Additional notes').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill(
      'Water is actively flooding. Emergency shutoff valve location needed.'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Handle potential AI follow-up questions or direct summary
    await page.waitForTimeout(5000); // Give AI time to process

    // Use the working Strategy 3: Find button with "Submit" text
    console.log('Looking for emergency submit button...');
    const emergencySubmit = page.locator('button').filter({ hasText: 'Submit' }).first();

    await emergencySubmit.waitFor({ timeout: 30000, state: 'visible' });
    console.log('✅ Found emergency submit button, clicking with force...');

    // Start waiting for the API call before clicking
    const emergencyApiCallPromise = page.waitForResponse(response =>
      response.url().includes('/api/requests/submit') && response.status() === 201
    );

    await emergencySubmit.click({ force: true });

    // Wait for the API call to complete successfully
    console.log('Waiting for emergency API submission response...');
    const emergencyApiResponse = await emergencyApiCallPromise;
    console.log('✅ Emergency API submission successful!');

    // Verify the response contains the expected data
    const emergencyResponseData = await emergencyApiResponse.json();
    expect(emergencyResponseData.message).toContain('Quote request submitted successfully');
    expect(emergencyResponseData.request).toBeDefined();
    expect(emergencyResponseData.request.id).toBeDefined();

    // Verify emergency submission - modal should close automatically
    // Wait for modal to close (the modal root should disappear)
    await page.waitForTimeout(2000); // Give time for modal to close

    // Verify we're back to the main page (modal should be gone)
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // Verify the "My Quote Requests" section is visible (indicating successful navigation)
    await expect(page.getByText('My Quote Requests')).toBeVisible();

    console.log('✅ Emergency quote request creation completed successfully!');
  });

  test('should handle different service categories', async ({ page }) => {
    // Sign in as regular user
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Click "Request a Quote" button
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "No"
    await page.getByRole('button', { name: 'No' }).click();

    // Select different service category - "Bathroom Renovation"
    await page.getByRole('button', { name: 'Bathroom Renovation' }).click();

    // Basic questions for bathroom renovation
    await page.waitForTimeout(2000); // Wait for AI agent to process
    await page.getByText('What is the property type?').first().waitFor();

    await page.locator('.MuiSelect-select').first().click();
    await page.getByRole('option', { name: 'Residential' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByText('Are you the homeowner?').first().waitFor();
    await page.waitForTimeout(3000); // Give more time for the select to render

    await page.locator('div[role="combobox"]').first().waitFor({ timeout: 10000 });
    await page.locator('div[role="combobox"]').first().click();

    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByText('Please describe the general problem or need.').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill(
      'Complete bathroom renovation needed'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByText('What is your preferred timing').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill('Within 2 weeks');
    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByText('Additional notes').waitFor({ timeout: 15000 });
    await page.getByPlaceholder('Type your answer...').fill(
      'Keep existing layout, upgrade fixtures'
    );
    await page.getByRole('button', { name: 'Send' }).click();

    // Handle potential AI follow-up questions or direct summary
    await page.waitForTimeout(5000); // Give AI time to process

    // Use the working Strategy 3: Find button with "Submit" text
    console.log('Looking for bathroom submit button...');
    const bathroomSubmit = page.locator('button').filter({ hasText: 'Submit' }).first();

    await bathroomSubmit.waitFor({ timeout: 30000, state: 'visible' });
    console.log('✅ Found bathroom submit button, clicking with force...');

    // Start waiting for the API call before clicking
    const bathroomApiCallPromise = page.waitForResponse(response =>
      response.url().includes('/api/requests/submit') && response.status() === 201
    );

    await bathroomSubmit.click({ force: true });

    // Wait for the API call to complete successfully
    console.log('Waiting for bathroom API submission response...');
    const bathroomApiResponse = await bathroomApiCallPromise;
    console.log('✅ Bathroom API submission successful!');

    // Verify the response contains the expected data
    const bathroomResponseData = await bathroomApiResponse.json();
    expect(bathroomResponseData.message).toContain('Quote request submitted successfully');
    expect(bathroomResponseData.request).toBeDefined();
    expect(bathroomResponseData.request.id).toBeDefined();

    // Verify successful submission - modal should close automatically
    // Wait for modal to close (the modal root should disappear)
    await page.waitForTimeout(2000); // Give time for modal to close

    // Verify we're back to the main page (modal should be gone)
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // Verify the "My Quote Requests" section is visible (indicating successful navigation)
    await expect(page.getByText('My Quote Requests')).toBeVisible();

    console.log('✅ Different service category quote request completed successfully!');
  });
});