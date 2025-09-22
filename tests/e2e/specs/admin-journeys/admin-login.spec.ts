import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Admin Authentication', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await page.goto('/');
  });

  test('should sign in admin user successfully', async ({ page }) => {
    console.log('🧪 Testing admin user sign in...');

    const success = await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(success).toBe(true);

    // Verify we're logged in
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    console.log('✅ Admin user sign in test passed');
  });

  test('should handle admin already logged in state', async ({ page }) => {
    console.log('🧪 Testing admin already logged in handling...');

    // Sign in first
    await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Try to sign in again (should detect already logged in)
    const secondSignIn = await authPage.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(secondSignIn).toBe(true); // Should return true for already logged in

    console.log('✅ Admin already logged in handling test passed');
  });
});