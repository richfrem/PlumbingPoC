/**
 * Complete User-to-Admin Workflow Integration Test Suite
 *
 * This spec tests the complete end-to-end workflow from user quote creation to admin quote response.
 *
 * ASSUMPTIONS:
 * - All foundation tests (auth, user journeys, admin journeys) have passed
 * - This spec tests the integration between user and admin workflows using Page Object building blocks
 *
 * Tests Performed:
 * 1. Full Workflow: User creates request -> Admin quotes -> User views quote - Complete user-admin business process
 */

import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../page-objects/pages/QuoteRequestPage';
import { DashboardPage } from '../../page-objects/pages/DashboardPage';
import { QuotePage } from '../../page-objects/pages/QuotePage';
import { CommandMenu } from '../../page-objects/components/CommandMenu';
import { AuthPage } from '../../page-objects/pages/AuthPage';

test.describe('Complete User-to-Admin Workflow Integration', () => {
  test('Full Workflow: User creates request -> Admin quotes -> User views quote', async ({ page }) => {
    const quoteRequestPage = new QuoteRequestPage(page);
    const dashboardPage = new DashboardPage(page);
    const quotePage = new QuotePage(page);
    const commandMenu = new CommandMenu(page);
    const authPage = new AuthPage(page);

    // --- Step 1: User Creates a Quote Request ---
    await page.goto('/');
    await authPage.signInAsUserType('user');
    const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains');

    // Verify the request appears on the user's dashboard before proceeding
    const newUserRequestRow = page.locator(`button[data-request-id="${requestId}"]`);
    await expect(newUserRequestRow).toBeVisible({ timeout: 15000 });

    await commandMenu.signOut();

    // --- Step 2: Admin Logs In, Finds, and Creates a Quote ---
    await authPage.signInAsUserType('admin');

    // Admins are redirected, so wait for the dashboard heading to be sure
    await expect(page.getByRole('heading', { name: "Plumber's Command Center" })).toBeVisible();

    await dashboardPage.findAndOpenRequest(requestId, 'admin');

    await quotePage.createQuote({
      description: 'Perimeter drain inspection and initial clearing',
      price: '450.00'
    });

    // Close the modal to finish the admin's part of the journey
    await page.locator('button[aria-label="Close modal"]').click();
    await commandMenu.signOut();

    // --- Step 3: User Logs Back In and Verifies the Quoted Status ---
    await authPage.signInAsUserType('user');

    const userRequestRow = page.locator(`button[data-request-id="${requestId}"]`);
    await userRequestRow.waitFor({ state: 'visible', timeout: 15000 });

    // Assert that the status is "quoted" and the correct total price (with tax) is shown
    await expect(userRequestRow.getByText('quoted', { exact: false })).toBeVisible();
    await expect(userRequestRow.getByText('$504.00')).toBeVisible();
    console.log('✅ User sees "quoted" status with correct price.');

    // --- Step 4: User Views Quote, Triggering "Viewed" Status Update ---
    await userRequestRow.click();
    await expect(page.getByText('Job Docket: Perimeter Drains')).toBeVisible();

    // Give Supabase Realtime a moment to process the "viewed" status update
    await page.waitForTimeout(3000);
    await page.locator('button[aria-label="Close modal"]').click();

    // Verify the status on the dashboard has changed to "viewed"
    await expect(userRequestRow.getByText('viewed', { exact: false })).toBeVisible({ timeout: 10000 });
    console.log('✅ Request status successfully updated to "viewed" on dashboard.');

    console.log('🎉 Complete user-to-admin workflow test finished successfully!');
  });
});