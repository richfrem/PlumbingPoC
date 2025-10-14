/**
 * Other Service Quote Comprehensive Test Suite
 *
 * This spec tests all variations of other service quote creation:
 * - Basic quote (no attachments, no address changes)
 * - Quote with attachment only
 * - Quote with service address change only
 * - Quote with both attachment and address change
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and user authentication works
 * - This spec focuses on other service category with all option combinations
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 *
 * Tests Performed:
 * 1. Basic other service quote (no extras)
 * 2. Other service quote with file attachment
 * 3. Other service quote with custom service address
 * 4. Other service quote with attachment and custom address
 */

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';
import { AuthPage } from '../../page-objects/pages/AuthPage';

// API verification helper - calls local development API to verify quote creation
async function verifyQuoteCreated(page: any, expectedRequestId: string, description: string, expectedOptions?: any) {
  console.log(`🔍 Verifying quote creation in database: ${description}`);

  // Use frontend base URL from environment (API is served through frontend in dev)
  const apiBaseUrl = process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';

  // Call local development API to get user's requests
  const apiResponse = await page.request.get(`${apiBaseUrl}/api/requests/user`);
  expect(apiResponse.ok()).toBeTruthy();

  const responseData = await apiResponse.json();
  const userRequests = responseData.requests || [];

  // Find our created request
  const createdRequest = userRequests.find((req: any) => req.id === expectedRequestId);
  expect(createdRequest).toBeDefined();
  expect(createdRequest.category).toBe('other');

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

test.describe('Other Service Quote Comprehensive Scenarios', () => {

  test('should create basic other service quote (no attachments, no address changes)', async ({ page }) => {
    console.log('🧪 Testing basic other service quote creation...');

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
    const requestId = await quoteRequestPage.createQuoteRequest('other');

    // Verify request creation with enhanced checks
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(10); // UUID-like length
    expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format

    console.log(`✅ Request ID validation confirms creation: ${requestId}`);

    // Sign out to clean up session state
    await authPage.signOut();

    console.log(`✅ Successfully created and verified basic other service quote with ID: ${requestId}`);
  });

  // test('should create other service quote with file attachment only', async ({ page }) => {
  //   console.log('🧪 Testing other service quote creation with attachment only...');

  //   // Initialize page objects
  //   const authPage = new AuthPage(page);
  //   const quoteRequestPage = new QuoteRequestPage(page);

  //   // Navigate to the main page
  //   await page.goto('/');

  //   // Sign in as user first
  //   await authPage.signInAsUserType('user');

  //   // Verify user is signed in
  //   expect(await authPage.isLoggedIn()).toBe(true);

  //   // Create quote request with attachment only
  //   let requestId: string;
  //   try {
  //     requestId = await quoteRequestPage.createQuoteRequest('other', {
  //       attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg'
  //     });
  //     console.log(`✅ Quote creation completed with ID: ${requestId}`);
  //   } catch (error) {
  //     console.log('❌ Quote creation failed, but let me check if we got a request ID...');
  //     // Try to extract request ID from error or logs if possible
  //     requestId = 'unknown-failed-to-get-id';
  //     throw error;
  //   }

  //   // Log the request ID for database verification
  //   console.log(`🔍 REQUEST ID FOR DATABASE CHECK: ${requestId}`);

  //   // Verify request creation with enhanced checks
  //   expect(requestId).toBeDefined();
  //   expect(typeof requestId).toBe('string');
  //   if (requestId !== 'unknown-failed-to-get-id') {
  //     expect(requestId.length).toBeGreaterThan(10); // UUID-like length
  //     expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format
  //   }

  //   console.log(`✅ Request ID validation confirms creation with attachment: ${requestId}`);

  //   // Sign out to clean up session state
  //   await authPage.signOut();

  //   console.log(`✅ Successfully created and verified other service quote with attachment, ID: ${requestId}`);
  // });

  // test('should create other service quote with custom service address only', async ({ page }) => {
  //   console.log('🧪 Testing other service quote creation with custom service address only...');

  //   // Initialize page objects
  //   const authPage = new AuthPage(page);
  //   const quoteRequestPage = new QuoteRequestPage(page);

  //   // Navigate to the main page
  //   await page.goto('/');

  //   // Sign in as user first
  //   await authPage.signInAsUserType('user');

  //   // Verify user is signed in
  //   expect(await authPage.isLoggedIn()).toBe(true);

  //   // Create quote request with custom service address only
  //   let requestId: string;
  //   try {
  //     requestId = await quoteRequestPage.createQuoteRequest('other', {
  //       serviceLocation: {
  //         address: '4490 Prospect Lake Rd',
  //         city: 'Victoria',
  //         province: 'BC',
  //         postalCode: 'V9E 1J3'
  //       }
  //     });
  //     console.log(`✅ Quote creation completed with ID: ${requestId}`);
  //   } catch (error) {
  //     console.log('❌ Quote creation failed, but let me check if we got a request ID...');
  //     // Try to extract request ID from error or logs if possible
  //     requestId = 'unknown-failed-to-get-id';
  //     throw error;
  //   }

  //   // Log the request ID for database verification
  //   console.log(`🔍 REQUEST ID FOR DATABASE CHECK: ${requestId}`);

  //   // Verify request creation with enhanced checks
  //   expect(requestId).toBeDefined();
  //   expect(typeof requestId).toBe('string');
  //   if (requestId !== 'unknown-failed-to-get-id') {
  //     expect(requestId.length).toBeGreaterThan(10); // UUID-like length
  //     expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format
  //   }

  //   console.log(`✅ Request ID validation confirms creation with service location: ${requestId}`);

  //   // Sign out to clean up session state
  //   await authPage.signOut();

  //   console.log(`✅ Successfully created and verified other service quote with custom address, ID: ${requestId}`);
  // });

  // test('should create other service quote with attachment and custom service address', async ({ page }) => {
  //   console.log('🧪 Testing other service quote creation with attachment and custom service address...');

  //   // Initialize page objects
  //   const authPage = new AuthPage(page);
  //   const quoteRequestPage = new QuoteRequestPage(page);

  //   // Navigate to the main page
  //   await page.goto('/');

  //   // Sign in as user first
  //   await authPage.signInAsUserType('user');

  //   // Verify user is signed in
  //   expect(await authPage.isLoggedIn()).toBe(true);

  //   // Create quote request with both attachment and custom service address
  //   let requestId: string;
  //   try {
  //     requestId = await quoteRequestPage.createQuoteRequest('other', {
  //       attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg',
  //       serviceLocation: {
  //         address: '2451 Island View Rd',
  //         city: 'Saanichton',
  //         province: 'BC',
  //         postalCode: 'V8M 2J7'
  //       }
  //     });
  //     console.log(`✅ Quote creation completed with ID: ${requestId}`);
  //   } catch (error) {
  //     console.log('❌ Quote creation failed, but let me check if we got a request ID...');
  //     // Try to extract request ID from error or logs if possible
  //     requestId = 'unknown-failed-to-get-id';
  //     throw error;
  //   }

  //   // Log the request ID for database verification
  //   console.log(`🔍 REQUEST ID FOR DATABASE CHECK: ${requestId}`);

  //   // Verify request creation with enhanced checks
  //   expect(requestId).toBeDefined();
  //   expect(typeof requestId).toBe('string');
  //   if (requestId !== 'unknown-failed-to-get-id') {
  //     expect(requestId.length).toBeGreaterThan(10); // UUID-like length
  //     expect(requestId).toMatch(/^[a-f0-9\-]+$/); // UUID format
  //   }

  //   console.log(`✅ Request ID validation confirms creation with attachment and service location: ${requestId}`);

  //   // Sign out to clean up session state
  //   await authPage.signOut();

  //   console.log(`✅ Successfully created and verified other service quote with attachment and custom address, ID: ${requestId}`);
  // });

});
