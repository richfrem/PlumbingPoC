/**
 * Other Service Quote Request with Attachment Test Suite
 *
 * This spec tests other service quote creation with file attachment and AI follow-up questions.
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and user authentication works
 * - This spec focuses on other service category with AI-enhanced conversations and attachments
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 *
 * Tests Performed:
 * 1. should create an other service quote request with file attachment using reusable function - Other service quote creation with AI follow-ups and attachment
 */

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