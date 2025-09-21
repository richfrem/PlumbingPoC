import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Quote Creation to My Requests Flow', () => {
  test('should create a quote request and verify it appears in My Requests', async ({ page }) => {
    const authPage = new AuthPage(page);

    console.log('🧪 Testing complete quote creation to My Requests flow...');

    // Sign in as regular user
    await page.goto('/');
    await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Navigate to My Requests to establish baseline
    console.log('📊 Checking initial My Requests state...');
    const initialRequestCount = await page.locator('[data-testid="my-request-item"]').count();
    console.log(`📊 Initial request count: ${initialRequestCount}`);

    // Click "Request a Quote" button
    console.log('🛠️ Starting quote creation...');
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Emergency triage - select "No" (not an emergency)
    await page.getByRole('button', { name: 'No' }).click();

    // Select service category - "Leak Repair"
    await page.getByRole('button', { name: 'Leak Repair' }).click();

    // Wait for modal to load and show first question
    await page.waitForTimeout(2000);
    console.log('🤖 Starting conversational flow...');

    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'debug-modal-start.png' });

    // Try a simpler approach - just fill in some basic answers and see if we can get to submit
    console.log('📝 Attempting to fill basic answers...');

    // Wait for and fill any input that appears
    try {
      const inputLocator = page.locator('input[placeholder="Type your answer..."], textarea[placeholder="Type your answer..."]').first();
      await inputLocator.waitFor({ timeout: 5000 });
      await inputLocator.fill('Test answer for any question');
      await page.keyboard.press('Enter');
      console.log('✅ Filled first input');
    } catch (e) {
      console.log('⚠️ No input found, looking for buttons...');
    }

    // Try clicking any available buttons
    try {
      const buttons = page.locator('button:not([disabled])').filter({ hasText: /^(?!×).+$/ });
      const buttonCount = await buttons.count();
      console.log(`🎯 Found ${buttonCount} buttons`);

      if (buttonCount > 0) {
        // Click first available button that looks like an answer
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const text = await button.textContent();
          if (text && (text.includes('Residential') || text.includes('Yes') || text.includes('No'))) {
            console.log(`✅ Clicking button: ${text}`);
            await button.click();
            break;
          }
        }
      }
    } catch (e) {
      console.log('⚠️ No suitable buttons found');
    }

    // Take another screenshot
    await page.screenshot({ path: 'debug-modal-progress.png' });

    // Keep trying to answer questions for a few iterations
    for (let attempt = 0; attempt < 5; attempt++) {
      console.log(`🔄 Attempt ${attempt + 1}/5`);

      // Check if submit button appeared
      const submitBtn = page.locator('button:has-text("Submit Quote Request")');
      if (await submitBtn.count() > 0) {
        console.log('✅ Submit button found!');
        break;
      }

      // Try to answer another question
      try {
        const input = page.locator('input[placeholder="Type your answer..."], textarea[placeholder="Type your answer..."]').first();
        if (await input.count() > 0) {
          await input.fill('Another test answer');
          await page.keyboard.press('Enter');
          console.log('✅ Filled another input');
        }
      } catch (e) {
        // Try buttons again
        try {
          const btn = page.locator('button:not([disabled])').filter({ hasText: /^(?!×).+$/ }).first();
          if (await btn.count() > 0) {
            const text = await btn.textContent();
            console.log(`✅ Clicking button: ${text}`);
            await btn.click();
          }
        } catch (e2) {
          console.log('⚠️ No inputs or buttons found');
        }
      }

      await page.waitForTimeout(1000);
    }

    // Wait for submission - this might take time due to GPT processing
    console.log('📤 Waiting for quote submission (may take time for GPT processing)...');

    // Try to wait for submit button, but if it doesn't appear, check if we can proceed anyway
    try {
      await page.waitForSelector('button:has-text("Submit Quote Request")', { timeout: 15000 });
      console.log('✅ Submit button found');
    } catch {
      console.log('⚠️ Submit button not found, checking for alternative completion...');
      // Check if there's a summary or completion state
      const summaryText = await page.locator('text=Please review your request below').count();
      if (summaryText > 0) {
        console.log('✅ Found summary, looking for submit button...');
        // Try different button selectors
        const submitBtn = await page.locator('button').filter({ hasText: /submit|Submit|SUBMIT/ }).first();
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
        } else {
          throw new Error('Could not find submit button in summary');
        }
      } else {
        throw new Error('Neither submit button nor summary found');
      }
    }

    // Click the submit button
    await page.getByRole('button', { name: 'Submit Quote Request' }).click();

    // Wait for success message
    await page.waitForSelector('text=Quote request submitted successfully', { timeout: 10000 });

    // Navigate to My Requests
    console.log('📋 Checking My Requests for new quote...');
    // The user should already be on the home page with My Requests visible
    // If not, we might need to scroll or navigate

    // Wait a moment for potential real-time updates
    await page.waitForTimeout(2000);

    // Check that the request count increased
    const finalRequestCount = await page.locator('[data-testid="my-request-item"]').count();
    console.log(`📊 Final request count: ${finalRequestCount}`);

    expect(finalRequestCount).toBeGreaterThan(initialRequestCount);

    // Verify the new request appears with correct details
    const newRequest = page.locator('[data-testid="my-request-item"]').first();
    await expect(newRequest).toContainText('Leak Repair');
    await expect(newRequest).toContainText('Kitchen sink leak');

    console.log('✅ Quote creation to My Requests flow test passed');
  });
});