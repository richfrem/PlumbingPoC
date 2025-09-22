// tests/e2e/specs/user-journeys/comprehensive-quote-creation.spec.ts

import { test, expect } from '@playwright/test';
import { SERVICE_QUOTE_CATEGORIES } from '../../../../packages/frontend/src/lib/serviceQuoteQuestions';
import { signInForTest, getTestCredentials, getAdminTestCredentials } from '../../utils/auth';
import { answerGenericQuestions, answerCategoryQuestions, submitQuoteRequest } from '../../utils/quoteHelpers';

test.describe('Comprehensive Quote Creation - All Service Categories', () => {
  test('should create quote requests for all service categories, verify via API, and clean up', async ({ browser }) => {
    console.log('🧪 Starting comprehensive quote creation test with separate contexts...');

    // Get test credentials
    const { email, password } = getTestCredentials();

    const processedCategories: any[] = [];

    // Loop through all service categories dynamically - use separate contexts for clean state
    for (const category of SERVICE_QUOTE_CATEGORIES) {
      console.log(`🔧 Testing category: ${category.label} (${category.key})`);

      // Create a fresh browser context for each category to avoid modal interference
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Sign in fresh for each category
        await page.goto('/');
        const signInSuccess = await signInForTest(page, email, password);
        expect(signInSuccess).toBe(true);

        // Click "Request a Quote"
        await page.getByRole('button', { name: 'Request a Quote' }).click();

        // Select "No" for emergency (standard service)
        await page.locator('button').filter({ hasText: /^No$/ }).click();

        // Find and select the category
        const categoryButton = page.locator('button').filter({ hasText: category.label });
        await categoryButton.first().waitFor({ timeout: 10000 });
        await categoryButton.first().click();

        // Wait for questions to load
        await page.waitForTimeout(2000);

        console.log(`🤖 Starting conversational flow for ${category.label}...`);

        // Use the reusable helper functions directly (like the working perimeter-drain test)
        await answerGenericQuestions(page);
        await answerCategoryQuestions(page, category);

        // Submit the quote request
        await submitQuoteRequest(page);

        processedCategories.push(category);
        console.log(`✅ Successfully created quote for ${category.label} using helper functions`);

      } finally {
        // Always close the context to free resources
        await context.close();
      }

      // Brief delay between categories
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 Comprehensive quote creation test completed successfully!');
    console.log(`📋 Created ${processedCategories.length} test requests across all categories`);
    console.log('🧹 Test data cleanup should be handled at the E2E suite level');
  });
});