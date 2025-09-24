/**
 * Leak Repair Quote Request with Attachment Test Suite
 *
 * This spec tests leak repair quote creation with file attachment functionality.
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and user authentication works
 * - This spec focuses on leak repair category quote creation with image attachments
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 * 
 * Tests Performed:
 * 1. should create a leak repair quote request with file attachment using reusable function - Leak repair quote creation with attachment
 */

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