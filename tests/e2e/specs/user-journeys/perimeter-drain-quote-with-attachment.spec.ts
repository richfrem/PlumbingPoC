// tests/e2e/specs/user-journeys/perimeter-drain-quote-with-attachment.spec.ts

import { test, expect } from '@playwright/test';
import { createQuoteRequest } from '../../utils/quoteHelpers';

test.describe('Perimeter Drain Quote Request with Attachment', () => {
  test('should create a perimeter drain quote request with file attachment using reusable function', async ({ page }) => {
    console.log('🧪 Testing perimeter drain quote creation with attachment using reusable function...');

    // Use the new reusable function
    const result = await createQuoteRequest(page, 'perimeter_drains', true);

    expect(result).toBe('success');

    console.log('✅ Successfully created perimeter drain quote request with attachment using reusable function!');
  });
});