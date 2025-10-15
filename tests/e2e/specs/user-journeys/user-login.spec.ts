/**
 * User Authentication Test Suite
 *
 * This spec tests all user authentication functionality using Page Object building blocks.
 *
 * Tests Performed:
 * 1. should sign in regular user successfully - Basic user sign in using building blocks
 * 2. should sign out successfully - Basic sign out functionality
 * 3. should handle already logged in state - Edge case handling for repeated sign ins
 * 4. should fail with invalid credentials - Error handling for authentication failures
 * 5. should sign out and redirect to login - Complete logout flow verification
 * 6. should handle sign out from different pages - Sign out robustness across app states
 * 7. should get current user info - User info retrieval functionality
 * 8. should sign in, wait 10 seconds, then sign out - Session persistence testing
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { logger } from '../../../../packages/frontend/src/lib/logger';


test.describe('User Authentication', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await page.goto('/');
  });

  test('should sign in regular user successfully', async ({ page }) => {
    // PRECONDITIONS: None - This is a foundational building block test
    // Tests the most basic authentication functionality
    logger.log('🧪 Testing regular user sign in...');

    await authPage.signInAsUserType('user');

    // Verify we're logged in
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    logger.log('✅ Regular user sign in test passed');
  });

  test('should sign out successfully', async ({ page }) => {
    logger.log('🧪 Testing sign out...');

    // First sign in
    await authPage.signInAsUserType('user');

    // Then sign out
    const signOutSuccess = await authPage.signOut();
    expect(signOutSuccess).toBe(true);

    // Verify we're logged out
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    logger.log('✅ Sign out test passed');
  });

  test('should handle already logged in state', async ({ page }) => {
    // PRECONDITIONS: User login must work (test: "should sign in regular user successfully")
    // Tests edge case handling when user is already authenticated
    logger.log('🧪 Testing already logged in handling...');

    // Sign in first
    await authPage.signInAsUserType('user');

    // Try to sign in again (should detect already logged in)
    await authPage.signInAsUserType('user'); // Should detect already logged in and skip

    logger.log('✅ Already logged in handling test passed');
  });

  test('should fail with invalid credentials', async ({ page }) => {
    // PRECONDITIONS: None - Tests error handling for authentication failures
    // Tests the authentication system's error handling capabilities
    logger.log('🧪 Testing invalid credentials...');

    const success = await authPage.signIn('invalid@example.com', 'wrongpassword');
    expect(success).toBe(false);

    // Should still be on sign in page
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    logger.log('✅ Invalid credentials test passed');
  });

  test('should sign out and redirect to login', async ({ page }) => {
    // PRECONDITIONS: User login must work (test: "should sign in regular user successfully")
    // Tests the logout functionality after successful authentication
    logger.log('🧪 Testing complete sign out flow...');

    // First sign in
    await authPage.signInAsUserType('user');

    // Verify we're logged in
    let isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    // Sign out
    const signOutSuccess = await authPage.signOut();
    expect(signOutSuccess).toBe(true);

    // Verify we're logged out
    isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    // Verify sign in button is visible (back to login state)
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

    logger.log('✅ Complete sign out flow test passed');
  });

  test('should handle sign out from different pages', async ({ page }) => {
    logger.log('🧪 Testing sign out from different application states...');

    // Sign in and navigate to different states
    await authPage.signInAsUserType('user');

    // Test sign out from main dashboard
    await authPage.signOut();
    let isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    // Sign back in and test sign out after navigation
    await authPage.signInAsUserType('user');
    await page.goto('/#/dashboard'); // Navigate to dashboard
    await authPage.signOut();
    isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    logger.log('✅ Sign out from different pages test passed');
  });

  test('should get current user info', async ({ page }) => {
    logger.log('🧪 Testing current user info retrieval...');

    // Sign in first
    await authPage.signInAsUserType('user');

    // Get current user
    const currentUser = await authPage.getCurrentUser();
    expect(currentUser).toBeTruthy();

    logger.log('✅ Current user info test passed');
  });

  test('should sign in, wait 10 seconds, then sign out', async ({ page }) => {
    logger.log('🧪 Testing sign in → 10 second wait → sign out flow...');

    // Sign in
    await authPage.signInAsUserType('user');

    // Verify we're logged in
    let isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
    logger.log('✅ User signed in successfully');

    // Wait 10 seconds as requested
    logger.log('⏰ Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    logger.log('✅ 10 second wait completed');

    // Sign out
    const signOutSuccess = await authPage.signOut();
    expect(signOutSuccess).toBe(true);

    // Verify we're logged out
    isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);
    logger.log('✅ User signed out successfully');

    logger.log('✅ Sign in → wait → sign out test completed successfully!');
  });
});
