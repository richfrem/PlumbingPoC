// tests/e2e/specs/user-journeys/other-service-quote-with-attachment.spec.ts

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';

test.describe('Other Service Quote Request with Attachment', () => {
  test('should create an other service quote request with file attachment using reusable function', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds for AI processing
    console.log('🧪 Testing other service quote creation with attachment using reusable function...');

    const quoteRequestPage = new QuoteRequestPage(page);

    // Use the new reusable function
    const requestId = await quoteRequestPage.createQuoteRequest('other');

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    console.log('✅ Successfully created other service quote request with attachment using reusable function!');
  });
});