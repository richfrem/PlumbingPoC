import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Authentication', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await page.goto('/');
  });

  test('should sign in regular user successfully', async ({ page }) => {
    // PRECONDITIONS: None - This is a foundational building block test
    // Tests the most basic authentication functionality
    console.log('🧪 Testing regular user sign in...');

    const success = await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);
    expect(success).toBe(true);

    // Verify we're logged in
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    console.log('✅ Regular user sign in test passed');
  });

  test('should sign out successfully', async ({ page }) => {
    console.log('🧪 Testing sign out...');

    // First sign in
    await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Then sign out
    const signOutSuccess = await authPage.signOut();
    expect(signOutSuccess).toBe(true);

    // Verify we're logged out
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    console.log('✅ Sign out test passed');
  });

  test('should handle already logged in state', async ({ page }) => {
    // PRECONDITIONS: User login must work (test: "should sign in regular user successfully")
    // Tests edge case handling when user is already authenticated
    console.log('🧪 Testing already logged in handling...');

    // Sign in first
    await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Try to sign in again (should detect already logged in)
    const secondSignIn = await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);
    expect(secondSignIn).toBe(true); // Should return true for already logged in

    console.log('✅ Already logged in handling test passed');
  });

  test('should fail with invalid credentials', async ({ page }) => {
    // PRECONDITIONS: None - Tests error handling for authentication failures
    // Tests the authentication system's error handling capabilities
    console.log('🧪 Testing invalid credentials...');

    const success = await authPage.signIn('invalid@example.com', 'wrongpassword');
    expect(success).toBe(false);

    // Should still be on sign in page
    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    console.log('✅ Invalid credentials test passed');
  });

  test('should sign out and redirect to login', async ({ page }) => {
    // PRECONDITIONS: User login must work (test: "should sign in regular user successfully")
    // Tests the logout functionality after successful authentication
    console.log('🧪 Testing complete sign out flow...');

    // First sign in
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

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

    console.log('✅ Complete sign out flow test passed');
  });

  test('should handle sign out from different pages', async ({ page }) => {
    console.log('🧪 Testing sign out from different application states...');

    // Sign in and navigate to different states
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Test sign out from main dashboard
    await authPage.signOut();
    let isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    // Sign back in and test sign out after navigation
    await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);
    await page.goto('/#/dashboard'); // Navigate to dashboard
    await authPage.signOut();
    isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);

    console.log('✅ Sign out from different pages test passed');
  });

  test('should get current user info', async ({ page }) => {
    console.log('🧪 Testing current user info retrieval...');

    // Sign in first
    await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Get current user
    const currentUser = await authPage.getCurrentUser();
    expect(currentUser).toBeTruthy();

    console.log('✅ Current user info test passed');
  });

  test('should sign in, wait 10 seconds, then sign out', async ({ page }) => {
    console.log('🧪 Testing sign in → 10 second wait → sign out flow...');

    // Sign in
    const signInSuccess = await authPage.signIn(TEST_USERS.customer.email, TEST_USERS.customer.password);
    expect(signInSuccess).toBe(true);

    // Verify we're logged in
    let isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
    console.log('✅ User signed in successfully');

    // Wait 10 seconds as requested
    console.log('⏰ Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    console.log('✅ 10 second wait completed');

    // Sign out
    const signOutSuccess = await authPage.signOut();
    expect(signOutSuccess).toBe(true);

    // Verify we're logged out
    isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(false);
    console.log('✅ User signed out successfully');

    console.log('✅ Sign in → wait → sign out test completed successfully!');
  });
});