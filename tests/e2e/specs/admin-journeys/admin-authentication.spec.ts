/**
 * Admin Authentication Test Suite
 *
 * This spec tests admin-specific authentication functionality using Page Object building blocks.
 *
 * ASSUMPTIONS:
 * - user-login.spec.ts tests have run first and basic authentication works
 * - This spec focuses specifically on admin user authentication and admin-specific UI elements
 *
 * Tests Performed:
 * 1. should sign in admin user successfully - Admin user sign in and Command Center access
 * 2. should handle admin already logged in state - Admin-specific already logged in handling
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';

test.describe('Admin Authentication', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await page.goto('/');
  });

  test('should sign in admin user successfully', async ({ page }) => {
    console.log('🧪 Testing admin user sign in...');

    await authPage.signInAsUserType('admin');

    // Verify we're logged in
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    // Verify admin has access to user menu (indicating successful login)
    await expect(page.locator('button:has(svg.lucide-chevron-down)')).toBeVisible();

    console.log('✅ Admin user sign in test passed');
  });

  test('should handle admin already logged in state', async ({ page }) => {
    console.log('🧪 Testing admin already logged in handling...');

    // Sign in first
    await authPage.signInAsUserType('admin');

    // Try to sign in again (should detect already logged in and skip)
    await authPage.signInAsUserType('admin');

    // Verify we're still logged in
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
    await expect(page.locator('button:has(svg.lucide-chevron-down)')).toBeVisible();

    console.log('✅ Admin already logged in handling test passed');
  });
});
