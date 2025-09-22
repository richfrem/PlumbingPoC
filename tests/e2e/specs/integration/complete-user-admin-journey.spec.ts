// tests/e2e/specs/integration/complete-user-admin-journey.spec.ts
//
// REQUIRES UI UPDATE: Add data-request-id attributes to request rows
// in both admin dashboard and user My Requests components
//
// Example: <div data-request-id={request.id} className="request-row">

import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials, getAdminTestCredentials } from '../../utils/auth';
import { submitQuoteRequest, answerGenericQuestions, answerCategoryQuestions } from '../../utils/quoteHelpers';
import { SERVICE_QUOTE_CATEGORIES } from '../../../../packages/frontend/src/lib/serviceQuoteQuestions';

test.describe('Complete User-to-Admin Workflow Integration', () => {
  // Store test context across the workflow
  let testRequestId: string;

  test('Step 1: User creates perimeter drain quote request with attachment', async ({ page }) => {
    console.log('🚰 Step 1: User creating perimeter drain quote request...');

    // Get test credentials
    const { email, password } = getTestCredentials();

    // Navigate to the app
    await page.goto('/');

    // Sign in using environment variables
    const signInSuccess = await signInForTest(page, email, password);
    expect(signInSuccess).toBe(true);

    // Click "Request a Quote"
    await page.getByRole('button', { name: 'Request a Quote' }).click();

    // Select "No" for emergency (standard service)
    await page.locator('button').filter({ hasText: /^No$/ }).click();

    // Find and select "Perimeter Drains" category
    const perimeterDrainsCategory = SERVICE_QUOTE_CATEGORIES.find(cat => cat.key === 'perimeter_drains');
    expect(perimeterDrainsCategory).toBeDefined();

    // Use more specific selector to avoid matching submitted requests
    await page.locator('button').filter({ hasText: perimeterDrainsCategory!.label }).filter({ hasText: /^Perimeter Drains$/ }).click();

    // Wait for questions to load
    await page.waitForTimeout(2000);

    console.log(`🤖 Starting conversational flow for ${perimeterDrainsCategory!.label}...`);

    // Use the reusable helper functions (same as working test)
    await answerGenericQuestions(page);
    await answerCategoryQuestions(page, perimeterDrainsCategory!);

    // Submit the quote request using the reusable function and capture ID
    const requestId = await submitQuoteRequest(page);
    testRequestId = requestId;

    console.log(`✅ Request created with ID: ${testRequestId}`);
  });

  test('Step 2: Admin logs in, finds request in dashboard, and views it', async ({ page }) => {
    console.log('👑 Step 2: Admin accessing dashboard and viewing request...');

    // Sign in as admin
    const { email, password } = getAdminTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Wait for dashboard to load
    await page.waitForTimeout(3000);

    // Find the test request by GUID (REQUIRES: data-request-id attribute on request rows)
    console.log(`🔍 Looking for request with GUID: ${testRequestId}`);
    const testRequest = page.locator(`[data-request-id="${testRequestId}"]`);

    await testRequest.waitFor({ timeout: 10000 });
    console.log('✅ Found test request in admin dashboard');

    // Click to view request details
    await testRequest.click();
    console.log('✅ Opened request details modal');

    // Verify request details are visible
    await expect(page.getByText('Job Docket')).toBeVisible();
    await expect(page.getByText('Water pooling in yard')).toBeVisible();
    console.log('✅ Request details verified');
  });

  test('Step 3: Admin creates a quote for the request', async ({ page }) => {
    console.log('💰 Step 3: Admin creating quote for the request...');

    // Sign in as admin (fresh session)
    const { email, password } = getAdminTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();
    await page.waitForTimeout(3000);

    // Find and open the test request
    const testRequest = page.locator(`[data-request-id="${testRequestId}"]`);
    await testRequest.click();

    // Click "Create Quote" button
    await page.getByRole('button', { name: 'Create Quote' }).click();
    console.log('✅ Opened quote creation modal');

    // Fill quote details
    await page.fill('input[name="quote_amount"]', '450.00');
    await page.fill('textarea[name="details"]', 'Complete perimeter drain installation including French drain, sump pump, and downspout extensions. Materials and labor included.');

    // Submit quote
    await page.getByRole('button', { name: 'Create Quote' }).click();

    // Verify quote was created
    await expect(page.getByText('Quote created successfully')).toBeVisible();
    console.log('✅ Quote created successfully');
  });

  test('Step 4: User checks My Requests dashboard and sees quoted status with price', async ({ page }) => {
    console.log('👤 Step 4: User checking My Requests for quoted status...');

    // Sign in as user
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Wait for dashboard to load with real-time updates
    await page.waitForTimeout(5000);

    // Find the test request in My Requests
    const testRequest = page.locator(`[data-request-id="${testRequestId}"]`);

    await testRequest.waitFor({ timeout: 10000 });
    console.log('✅ Found test request in My Requests');

    // Verify status shows as quoted and price is visible
    await expect(testRequest.filter({ hasText: 'quoted' }).or(testRequest.filter({ hasText: 'Quoted' }))).toBeVisible();
    await expect(testRequest.filter({ hasText: '$450' })).toBeVisible();
    console.log('✅ Request shows quoted status with $450 price');
  });

  test('Step 5-7: User opens request, views quote, and status changes to viewed', async ({ page }) => {
    console.log('👀 Step 5-7: User opening request and viewing quote...');

    // Sign in as user
    const { email, password } = getTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Find and click the test request
    const testRequest = page.locator(`[data-request-id="${testRequestId}"]`);
    await testRequest.click();
    console.log('✅ Opened request details');

    // Find and click the quote to view it
    const quoteItem = page.locator('[data-testid="quote-item"]').first();
    await quoteItem.waitFor({ timeout: 10000 });
    await quoteItem.click();
    console.log('✅ Opened quote details');

    // Verify quote details
    await expect(page.getByText('Quote Details')).toBeVisible();
    await expect(page.getByText('$450.00')).toBeVisible();
    console.log('✅ Quote details verified');

    // Wait for status to update to "viewed" (may take a moment for real-time update)
    await page.waitForTimeout(3000);

    // Go back to dashboard to check status
    await page.goto('/#/dashboard');
    await page.waitForTimeout(2000);

    // Verify status changed to viewed
    const updatedRequest = page.locator(`[data-request-id="${testRequestId}"]`);
    await expect(updatedRequest.filter({ hasText: 'viewed' }).or(updatedRequest.filter({ hasText: 'Viewed' }))).toBeVisible();
    console.log('✅ Request status updated to viewed');

    console.log('🎉 Complete user-to-admin workflow test finished successfully!');
  });
});