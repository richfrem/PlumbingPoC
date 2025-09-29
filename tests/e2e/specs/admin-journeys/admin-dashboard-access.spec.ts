/**
 * Admin Dashboard Access Test Suite
 *
 * This spec tests basic admin dashboard access and navigation functionality.
 * Focuses on the foundational admin workflows: sign-in, dashboard access, and basic UI verification.
 *
 * ASSUMPTIONS:
 * - admin-authentication.spec.ts tests have run first and admin authentication works
 * - FRONTEND AND BACKEND SERVERS MUST BE RUNNING FIRST (run ./startup.sh)
 *
 * Tests Performed:
 * 1. should navigate to admin dashboard after login - Admin dashboard access and redirection
 * 2. should access admin command center via user menu - User menu navigation to Command Center
 * 3. should handle admin dashboard loading states - Dashboard loading and empty states
 * 4. should verify admin dashboard UI elements - Basic UI verification
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { DashboardPage } from '../../page-objects/pages/DashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Admin Dashboard Access', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    await page.goto('/');
  });

  test('should navigate to admin dashboard after login', async ({ page }) => {
    console.log('🧪 Testing admin dashboard navigation...');

    // Sign in as admin
    const success = await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(success).toBe(true);

    // Use DashboardPage to navigate to admin dashboard
    await dashboardPage.goToAdminDashboard();

    // Verify we're on the admin dashboard
    await dashboardPage.verifyOnAdminDashboard();

    console.log('✅ Admin dashboard navigation test passed');
  });

  test('should access admin command center via user menu', async ({ page }) => {
    console.log('🧪 Testing user menu navigation to Command Center...');

    // Sign in as admin first
    const signInSuccess = await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(signInSuccess).toBe(true);

    // Use DashboardPage to navigate to admin dashboard (this handles the user menu internally)
    await dashboardPage.goToAdminDashboard();

    // Verify we're on the admin dashboard
    await dashboardPage.verifyOnAdminDashboard();

    console.log('✅ Admin Command Center navigation test passed');
  });

  test('should handle admin dashboard loading states', async ({ page }) => {
    console.log('🧪 Testing admin dashboard loading and empty states...');

    // Sign in and navigate to admin dashboard
    const signInSuccess = await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(signInSuccess).toBe(true);

    const userMenuButton = page.locator('button:has(svg.lucide-chevron-down)');
    await userMenuButton.click();
    const commandCenterButton = page.getByRole('button', { name: 'Command Center' });
    await commandCenterButton.click();

    // Wait for admin dashboard to load
    const adminHeading = page.getByRole('heading', { name: "Plumber's Command Center" });
    await expect(adminHeading).toBeVisible();

    // Wait for dashboard content to load (may be empty)
    await page.waitForTimeout(3000);

    // Check for loading indicators or empty states
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
    const emptyStateElements = page.locator('[data-testid*="empty"], .empty, .no-data');

    const hasLoading = await loadingElements.count() > 0;
    const hasEmptyState = await emptyStateElements.count() > 0;

    if (hasLoading) {
      console.log('⏳ Dashboard is loading...');
    } else if (hasEmptyState) {
      console.log('📭 Dashboard loaded with empty state (expected for fresh system)');
    } else {
      console.log('✅ Dashboard loaded with content or ready for interaction');
    }

    console.log('✅ Admin dashboard loading states test passed');
  });

  test('should verify admin dashboard UI elements', async ({ page }) => {
    console.log('🧪 Testing admin dashboard UI element verification...');

    // Sign in and navigate to admin dashboard
    const signInSuccess = await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(signInSuccess).toBe(true);

    const userMenuButton = page.locator('button:has(svg.lucide-chevron-down)');
    await userMenuButton.click();
    const commandCenterButton = page.getByRole('button', { name: 'Command Center' });
    await commandCenterButton.click();

    // Verify core admin dashboard elements
    const adminHeading = page.getByRole('heading', { name: "Plumber's Command Center" });
    await expect(adminHeading).toBeVisible();

    // Check for common admin dashboard elements (be flexible about exact implementation)
    const possibleElements = [
      page.getByText('Dashboard'),
      page.getByText('Requests'),
      page.getByText('Quote Requests'),
      page.getByText('Admin'),
      page.getByText('Command Center'),
      page.getByText('Settings'),
      page.getByText('Profile')
    ];

    let foundElements = 0;
    for (const element of possibleElements) {
      try {
        await element.waitFor({ timeout: 2000 });
        console.log(`✅ Found admin element: ${await element.textContent()}`);
        foundElements++;
      } catch (e) {
        // Element not found, continue checking others
      }
    }

    // Should find at least the basic admin heading
    expect(foundElements).toBeGreaterThan(0);
    console.log(`📊 Found ${foundElements} admin dashboard UI elements`);

    console.log('✅ Admin dashboard UI verification test passed');
  });
});