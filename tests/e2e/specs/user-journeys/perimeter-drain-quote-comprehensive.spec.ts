/**
 * Perimeter Drain Quote Comprehensive Test Suite
 *
 * This spec tests all variations of perimeter drain quote creation:
 * - Basic quote (no attachments, no address changes)
 * - Quote with attachment only
 * - Quote with service address change only
 * - Quote with both attachment and address change
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and user authentication works
 * - This spec focuses on perimeter drain category with all option combinations
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 *
 * Tests Performed:
 * 1. Basic perimeter drain quote (no extras)
 * 2. Perimeter drain quote with file attachment
 * 3. Perimeter drain quote with custom service address
 * 4. Perimeter drain quote with attachment and custom address
 */

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';
import { AuthPage } from '../../page-objects/pages/AuthPage';

test.describe('Perimeter Drain Quote Comprehensive Scenarios', () => {

  test('should create basic perimeter drain quote (no attachments, no address changes)', async ({ page }) => {
    console.log('🧪 Testing basic perimeter drain quote creation...');

    // Initialize page objects
    const authPage = new AuthPage(page);
    const quoteRequestPage = new QuoteRequestPage(page);

    // Navigate to the main page
    await page.goto('/');

    // Sign in as user first
    await authPage.signInAsUserType('user');

    // Verify user is signed in
    expect(await authPage.isLoggedIn()).toBe(true);

    // Create basic quote request (no options)
    const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains');

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    // Sign out to clean up session state
    await authPage.signOut();

    console.log('✅ Successfully created basic perimeter drain quote!');
  });

  test('should create perimeter drain quote with file attachment only', async ({ page }) => {
    console.log('🧪 Testing perimeter drain quote creation with attachment only...');

    // Initialize page objects
    const authPage = new AuthPage(page);
    const quoteRequestPage = new QuoteRequestPage(page);

    // Navigate to the main page
    await page.goto('/');

    // Sign in as user first
    await authPage.signInAsUserType('user');

    // Verify user is signed in
    expect(await authPage.isLoggedIn()).toBe(true);

    // Create quote request with attachment only
    const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains', {
      attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg'
    });

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    // Sign out to clean up session state
    await authPage.signOut();

    console.log('✅ Successfully created perimeter drain quote with attachment!');
  });

  test('should create perimeter drain quote with custom service address only', async ({ page }) => {
    console.log('🧪 Testing perimeter drain quote creation with custom service address only...');

    // Initialize page objects
    const authPage = new AuthPage(page);
    const quoteRequestPage = new QuoteRequestPage(page);

    // Navigate to the main page
    await page.goto('/');

    // Sign in as user first
    await authPage.signInAsUserType('user');

    // Verify user is signed in
    expect(await authPage.isLoggedIn()).toBe(true);

    // Create quote request with custom service address only
    const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains', {
      serviceLocation: {
        address: '4490 Prospect Lake Rd',
        city: 'Victoria',
        postalCode: 'BC V9E 1J3'
      }
    });

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    // Sign out to clean up session state
    await authPage.signOut();

    console.log('✅ Successfully created perimeter drain quote with custom service address!');
  });

  test('should create perimeter drain quote with attachment and custom service address', async ({ page }) => {
    console.log('🧪 Testing perimeter drain quote creation with both attachment and custom address...');

    // Initialize page objects
    const authPage = new AuthPage(page);
    const quoteRequestPage = new QuoteRequestPage(page);

    // Navigate to the main page
    await page.goto('/');

    // Sign in as user first
    await authPage.signInAsUserType('user');

    // Verify user is signed in
    expect(await authPage.isLoggedIn()).toBe(true);

    // Create quote request with both attachment and custom service address
    const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains', {
      attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg',
      serviceLocation: {
        address: '5325 Cordova Bay Rd',
        city: 'Victoria',
        postalCode: 'BC V8Y 2L3'
      }
    });

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);

    // Sign out to clean up session state
    await authPage.signOut();

    console.log('✅ Successfully created perimeter drain quote with attachment and custom address!');
  });

});