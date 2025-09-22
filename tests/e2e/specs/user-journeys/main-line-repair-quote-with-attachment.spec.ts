// tests/e2e/specs/user-journeys/main-line-repair-quote-with-attachment.spec.ts

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';

test.describe('Main Line Repair Quote Request with Attachment', () => {
  test('should create a main line repair quote request with file attachment using reusable function', async ({ page }) => {
    console.log('🧪 Testing main line repair quote creation with attachment using reusable function...');

    const quoteRequestPage = new QuoteRequestPage(page);

    // Use the new reusable function
    const requestId = await quoteRequestPage.createQuoteRequest('main_line_repair');

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    console.log('✅ Successfully created main line repair quote request with attachment using reusable function!');
  });
});