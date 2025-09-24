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

// API verification helper - calls local development API to verify quote creation
async function verifyQuoteCreated(page: any, expectedRequestId: string, description: string, expectedOptions?: any) {
  console.log(`🔍 Verifying quote creation in database: ${description}`);

  // Call local development API to get user's requests
  const apiResponse = await page.request.get('http://localhost:5173/api/requests/user');
  expect(apiResponse.ok()).toBeTruthy();

  const responseData = await apiResponse.json();
  const userRequests = responseData.requests || [];

  // Find our created request
  const createdRequest = userRequests.find((req: any) => req.id === expectedRequestId);
  expect(createdRequest).toBeDefined();
  expect(createdRequest.category).toBe('perimeter_drains');

  // Verify additional data if options provided
  if (expectedOptions?.attachmentPath) {
    expect(createdRequest.attachments).toBeDefined();
    expect(createdRequest.attachments.length).toBeGreaterThan(0);
    console.log('✅ Verified attachment was saved');
  }

  if (expectedOptions?.serviceLocation) {
    expect(createdRequest.serviceLocation).toBeDefined();
    expect(createdRequest.serviceLocation.address).toBe(expectedOptions.serviceLocation.address);
    console.log('✅ Verified service location was saved');
  }

  console.log(`✅ Verified quote exists in database with correct data: ${expectedRequestId}`);
  return createdRequest;
}

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

    // Verify request creation with enhanced checks
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(10); // UUID-like length
    expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format

    // API verification: Confirm quote exists in database
    await verifyQuoteCreated(page, requestId, 'basic perimeter drain quote');

    // Sign out to clean up session state
    await authPage.signOut();

    console.log(`✅ Successfully created and verified basic perimeter drain quote with ID: ${requestId}`);
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

    // Verify request creation with enhanced checks
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(10); // UUID-like length
    expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format

    // API verification: Confirm quote with attachment exists in database
    await verifyQuoteCreated(page, requestId, 'perimeter drain quote with attachment', {
      attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg'
    });

    // Sign out to clean up session state
    await authPage.signOut();

    console.log(`✅ Successfully created and verified perimeter drain quote with attachment, ID: ${requestId}`);
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

    // Verify request creation with enhanced checks
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(10); // UUID-like length
    expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format

    // API verification: Confirm quote with service location exists in database
    await verifyQuoteCreated(page, requestId, 'perimeter drain quote with service location', {
      serviceLocation: {
        address: '4490 Prospect Lake Rd',
        city: 'Victoria',
        postalCode: 'BC V9E 1J3'
      }
    });

    // Sign out to clean up session state
    await authPage.signOut();

    console.log(`✅ Successfully created and verified perimeter drain quote with custom address, ID: ${requestId}`);
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

    // Verify request creation with enhanced checks
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(10); // UUID-like length
    expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format

    // API verification: Confirm quote with both attachment and location exists in database
    await verifyQuoteCreated(page, requestId, 'perimeter drain quote with attachment and location', {
      attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg',
      serviceLocation: {
        address: '5325 Cordova Bay Rd',
        city: 'Victoria',
        postalCode: 'BC V8Y 2L3'
      }
    });

    // Sign out to clean up session state
    await authPage.signOut();

    console.log(`✅ Successfully created and verified perimeter drain quote with attachment and address, ID: ${requestId}`);
  });

});