// tests/e2e/specs/user-journeys/comprehensive-quote-creation.spec.ts

import { test, expect } from '@playwright/test';
import { SERVICE_QUOTE_CATEGORIES } from '../../../../packages/frontend/src/lib/serviceQuoteQuestions';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';

test.describe('Comprehensive Quote Creation - All Service Categories', () => {
  test('should create quote requests for all service categories using Page Objects', async ({ browser }) => {
    console.log('🧪 Starting comprehensive quote creation test with separate contexts...');

    const processedCategories: any[] = [];

    // Loop through all service categories dynamically - use separate contexts for clean state
    for (const category of SERVICE_QUOTE_CATEGORIES) {
      console.log(`🔧 Testing category: ${category.label} (${category.key})`);

      // Create a fresh browser context for each category to avoid modal interference
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Initialize Page Objects
        const authPage = new AuthPage(page);
        const quoteRequestPage = new QuoteRequestPage(page);

        // Sign in using Page Object
        await authPage.signInAsUserType('user');

        // Create quote request using Page Object method
        const requestId = await quoteRequestPage.createQuoteRequest(category.key);

        expect(requestId).toBeDefined();
        expect(typeof requestId).toBe('string');
        expect(requestId.length).toBeGreaterThan(0);

        processedCategories.push(category);
        console.log(`✅ Successfully created quote for ${category.label} using Page Object methods`);

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