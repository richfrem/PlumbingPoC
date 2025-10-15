/**
 * Comprehensive Quote Creation Test Suite
 *
 * This spec tests quote request creation across all 8 plumbing service categories using Page Object Model.
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and user authentication works
 * - This spec focuses on end-to-end quote creation workflows using AI-enhanced conversations
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 *
 * Tests Performed:
 * 1. should create quote requests for all service categories using Page Objects - Complete quote creation workflow for all categories
 */

import { test, expect } from '@playwright/test';
import { SERVICE_QUOTE_CATEGORIES } from '../../../../packages/frontend/src/lib/serviceQuoteQuestions';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';
import { logger } from '../../../../packages/frontend/src/lib/logger';


test.describe('Comprehensive Quote Creation - All Service Categories', () => {
  test('should create quote requests for all service categories using Page Objects', async ({ browser }) => {
    logger.log('🧪 Starting comprehensive quote creation test with separate contexts...');

    const processedCategories: any[] = [];

    // Loop through all service categories dynamically - use separate contexts for clean state
    for (const category of SERVICE_QUOTE_CATEGORIES) {
      logger.log(`🔧 Testing category: ${category.label} (${category.key})`);

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
        logger.log(`✅ Successfully created quote for ${category.label} using Page Object methods`);

      } finally {
        // Always close the context to free resources
        await context.close();
      }

      // Brief delay between categories
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.log('🎉 Comprehensive quote creation test completed successfully!');
    logger.log(`📋 Created ${processedCategories.length} test requests across all categories`);
    logger.log('🧹 Test data cleanup should be handled at the E2E suite level');
  });
});
