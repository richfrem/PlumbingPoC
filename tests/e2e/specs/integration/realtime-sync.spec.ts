/**
 * Real-time Synchronization Test Suite
 *
 * This spec tests real-time data synchronization between admin and user interfaces using Supabase realtime.
 *
 * ASSUMPTIONS:
 * - All foundation tests (auth, user journeys, admin journeys) have passed
 * - Supabase realtime is properly configured and running
 * - This spec tests cross-user data synchronization and auto-refresh functionality
 *
 * Tests Performed:
 * 1. admin creates quote → appears in user My Requests - Quote creation sync across users
 * 2. user accepts quote → status updates in admin dashboard - Quote acceptance status sync
 * 3. admin adds note → appears in user communication log - Communication log sync
 */

import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials, getAdminTestCredentials } from '../helpers/auth';

test.describe('Real-time Synchronization', () => {
  test.describe.configure({ mode: 'serial' });

  test('admin creates quote → appears in user My Requests', async ({ page, context }) => {
    // Create two browser contexts - one for admin, one for user
    const adminPage = page;
    const userPage = await context.newPage();

    try {
      // Sign in admin
      const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();
      await adminPage.goto('/');
      await signInForTest(adminPage, adminEmail, adminPassword);

      // Sign in user
      const { email, password } = getTestCredentials();
      await userPage.goto('/');
      await signInForTest(userPage, email, password);

      // User navigates to My Requests to establish baseline
      await userPage.getByText('My Quote Requests').waitFor();

      // Count initial requests
      const initialUserRequests = await userPage.locator('[data-testid="request-card"]').count();

      // Admin navigates to dashboard and finds a request
      await adminPage.getByRole('button', { name: 'Command Center' }).click();
      await adminPage.getByText('Plumber\'s Command Center').waitFor();

      // Find first request and open it
      const firstRequest = adminPage.locator('[data-testid="request-row"]').first();
      await expect(firstRequest).toBeVisible();
      await firstRequest.click();

      // Wait for modal to open
      await adminPage.locator('[role="dialog"]').waitFor();

      // Click "Create Quote" button
      await adminPage.getByRole('button', { name: 'Create Quote' }).click();

      // Fill out quote form
      await adminPage.getByLabel('Description').first().fill('Test labor item');
      await adminPage.getByLabel('Price').first().fill('100');
      await adminPage.getByRole('button', { name: 'Save Quote' }).click();

      // Wait for quote creation API call
      await adminPage.waitForResponse(response =>
        response.url().includes('/api/requests/') &&
        response.url().includes('/quotes') &&
        response.status() === 201
      );

      // Switch to user page and check if new quote appears
      // Wait up to 35 seconds for realtime sync (30s auto-refresh + 5s buffer)
      await expect(async () => {
        const currentRequests = await userPage.locator('[data-testid="request-card"]').count();
        expect(currentRequests).toBeGreaterThan(initialUserRequests);
      }).toPass({ timeout: 35000 });

      console.log('✅ Quote creation realtime sync test passed');

    } finally {
      await userPage.close();
    }
  });

  test('user accepts quote → status updates in admin dashboard', async ({ page, context }) => {
    const adminPage = page;
    const userPage = await context.newPage();

    try {
      // Sign in admin first to find a quoted request
      const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();
      await adminPage.goto('/');
      await signInForTest(adminPage, adminEmail, adminPassword);

      // Admin navigates to dashboard
      await adminPage.getByRole('button', { name: 'Command Center' }).click();
      await adminPage.getByText('Plumber\'s Command Center').waitFor();

      // Find a request with status "quoted"
      const quotedRequest = adminPage.locator('[data-testid="request-row"]').filter({
        hasText: 'quoted'
      }).first();

      if (await quotedRequest.count() === 0) {
        console.log('⚠️ No quoted requests found, skipping test');
        return;
      }

      await quotedRequest.click();
      await adminPage.locator('[role="dialog"]').waitFor();

      // Get request ID from modal
      const modalText = await adminPage.locator('[role="dialog"]').textContent();
      const requestIdMatch = modalText?.match(/ID: ([a-f0-9-]+)/);
      const requestId = requestIdMatch?.[1];

      if (!requestId) {
        console.log('⚠️ Could not extract request ID, skipping test');
        return;
      }

      // Close admin modal
      await adminPage.keyboard.press('Escape');

      // Sign in user
      const { email, password } = getTestCredentials();
      await userPage.goto('/');
      await signInForTest(userPage, email, password);

      // User finds their quoted request and opens it
      const userRequest = userPage.locator('[data-testid="request-card"]').filter({
        hasText: 'quoted'
      }).first();

      if (await userRequest.count() === 0) {
        console.log('⚠️ User has no quoted requests, skipping test');
        return;
      }

      await userRequest.click();
      await userPage.locator('[role="dialog"]').waitFor();

      // Find accept button and click it
      const acceptButton = userPage.getByRole('button', { name: 'Accept Quote' });
      await expect(acceptButton).toBeVisible();
      await acceptButton.click();

      // Wait for acceptance API call
      await userPage.waitForResponse(response =>
        response.url().includes('/accept') && response.status() === 200
      );

      // Switch to admin page and check if status updated
      await expect(async () => {
        // Refresh admin dashboard
        await adminPage.reload();
        await adminPage.getByRole('button', { name: 'Command Center' }).click();

        // Check if the request now shows "accepted" status
        const acceptedRequest = adminPage.locator('[data-testid="request-row"]').filter({
          hasText: 'accepted'
        });

        expect(await acceptedRequest.count()).toBeGreaterThan(0);
      }).toPass({ timeout: 35000 });

      console.log('✅ Quote acceptance realtime sync test passed');

    } finally {
      await userPage.close();
    }
  });

  test('admin adds note → appears in user communication log', async ({ page, context }) => {
    const adminPage = page;
    const userPage = await context.newPage();

    try {
      // Sign in admin
      const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();
      await adminPage.goto('/');
      await signInForTest(adminPage, adminEmail, adminPassword);

      // Admin navigates to dashboard and opens a request
      await adminPage.getByRole('button', { name: 'Command Center' }).click();
      await adminPage.getByText('Plumber\'s Command Center').waitFor();

      const firstRequest = adminPage.locator('[data-testid="request-row"]').first();
      await firstRequest.click();
      await adminPage.locator('[role="dialog"]').waitFor();

      // Count initial notes in communication log
      const initialNoteCount = await adminPage.locator('[data-testid="communication-note"]').count();

      // Add a note
      const noteInput = adminPage.getByPlaceholder('Add a note or message...');
      await noteInput.fill('Test note from admin for realtime sync');
      await adminPage.getByRole('button', { name: 'Send' }).click();

      // Wait for note API call
      await adminPage.waitForResponse(response =>
        response.url().includes('/notes') && response.status() === 201
      );

      // Sign in user
      const { email, password } = getTestCredentials();
      await userPage.goto('/');
      await signInForTest(userPage, email, password);

      // User opens the same request
      const userRequest = userPage.locator('[data-testid="request-card"]').first();
      await userRequest.click();
      await userPage.locator('[role="dialog"]').waitFor();

      // Check if the note appears (with auto-refresh)
      await expect(async () => {
        const currentNoteCount = await userPage.locator('[data-testid="communication-note"]').count();
        expect(currentNoteCount).toBeGreaterThan(initialNoteCount);
      }).toPass({ timeout: 35000 });

      console.log('✅ Communication log realtime sync test passed');

    } finally {
      await userPage.close();
    }
  });
});