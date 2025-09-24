/**
 * Perimeter Drain Quote Request with Attachment Test Suite
 *
 * This spec tests perimeter drain quote creation with file attachment functionality.
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and user authentication works
 * - This spec focuses on perimeter drain category quote creation with image attachments
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 *
 * Tests Performed:
 * 1. should create a perimeter drain quote request with file attachment using reusable function - Perimeter drain quote creation with attachment
 */

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { AttachmentSection } from '../../page-objects/components/AttachmentSection';

test.describe('Perimeter Drain Quote Request with Attachment', () => {
  test('should create a perimeter drain quote request with file attachment using reusable function', async ({ page }) => {
    console.log('🧪 Testing perimeter drain quote creation with attachment using reusable function...');

    // Initialize page objects
    const authPage = new AuthPage(page);
    const quoteRequestPage = new QuoteRequestPage(page);
    const attachmentSection = new AttachmentSection(page);

    // Navigate to the main page
    await page.goto('/');

    // Sign in as user first
    await authPage.signInAsUserType('user');

    // Verify user is signed in
    expect(await authPage.isLoggedIn()).toBe(true);

    // Use the quote request function with attachment
    const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains', {
      attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg'
    });

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    // Sign out to clean up session state
    await authPage.signOut();

    console.log('✅ Successfully created perimeter drain quote request with attachment using reusable function!');
  });
});