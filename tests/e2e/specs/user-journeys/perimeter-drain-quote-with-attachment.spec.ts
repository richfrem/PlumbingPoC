// tests/e2e/specs/user-journeys/perimeter-drain-quote-with-attachment.spec.ts

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';

test.describe('Perimeter Drain Quote Request with Attachment', () => {
  test('should create a perimeter drain quote request with file attachment using reusable function', async ({ page }) => {
    console.log('🧪 Testing perimeter drain quote creation with attachment using reusable function...');

    const quoteRequestPage = new QuoteRequestPage(page);

    // Use the new reusable function
    const result = await quoteRequestPage.createQuoteRequest('perimeter_drains');

    expect(result).toBe('success');

    console.log('✅ Successfully created perimeter drain quote request with attachment using reusable function!');
  });
});