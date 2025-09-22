// tests/e2e/specs/user-journeys/leak-repair-quote-with-attachment.spec.ts

import { test, expect } from '@playwright/test';
import { createQuoteRequest } from '../../utils/quoteHelpers';

test.describe('Leak Repair Quote Request with Attachment', () => {
  test('should create a leak repair quote request with file attachment using reusable function', async ({ page }) => {
    console.log('🧪 Testing leak repair quote creation with attachment using reusable function...');

    // Use the new reusable function
    const result = await createQuoteRequest(page, 'leak_repair', true);

    expect(result).toBe('success');

    console.log('✅ Successfully created leak repair quote request with attachment using reusable function!');
  });
});