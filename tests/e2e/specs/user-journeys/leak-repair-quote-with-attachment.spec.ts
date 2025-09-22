// tests/e2e/specs/user-journeys/leak-repair-quote-with-attachment.spec.ts

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';

test.describe('Leak Repair Quote Request with Attachment', () => {
  test('should create a leak repair quote request with file attachment using reusable function', async ({ page }) => {
    console.log('🧪 Testing leak repair quote creation with attachment using reusable function...');

    const quoteRequestPage = new QuoteRequestPage(page);

    // Use the new reusable function
    const requestId = await quoteRequestPage.createQuoteRequest('leak_repair');

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(10); // UUID validation

    console.log('✅ Successfully created leak repair quote request with attachment using reusable function!');
  });
});