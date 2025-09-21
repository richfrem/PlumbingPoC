import { test, expect } from '@playwright/test';
import { signInForTest, getAdminTestCredentials } from '../helpers/auth';

test.describe('Admin Dashboard and Quote Management', () => {
  test('should access admin command center and view dashboard', async ({ page }) => {
    // Get admin credentials
    const { email, password } = getAdminTestCredentials();

    // Navigate to the application
    await page.goto('/');

    // Sign in as admin
    const loginSuccess = await signInForTest(page, email, password);
    expect(loginSuccess).toBe(true);

    // Click user menu to access Command Center
    await page.locator('button:has(svg.lucide-chevron-down)').click();

    // Click Command Center option
    await page.getByText('Command Center').click();

    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify admin dashboard elements
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Quote Requests')).toBeVisible();
  });

  test('should create a quote for an existing request', async ({ page }) => {
    // Get admin credentials
    const { email, password } = getAdminTestCredentials();

    // Navigate to the application
    await page.goto('/');

    // Sign in as admin
    const loginSuccess = await signInForTest(page, email, password);
    expect(loginSuccess).toBe(true);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Find the first quote request
    const firstRequest = page.locator('[data-testid="quote-request-item"]').first();

    // Click to view request details
    await firstRequest.click();

    // Verify request details modal opens
    await expect(page.getByText('Job Docket')).toBeVisible();

    // Click "Create Quote" button
    await page.getByRole('button', { name: 'Create Quote' }).click();

    // Fill quote details
    await page.fill('input[name="quote_amount"]', '150.00');
    await page.fill('textarea[name="details"]', 'Professional leak repair service including materials and labor.');

    // Submit quote
    await page.getByRole('button', { name: 'Create Quote' }).click();

    // Verify quote was created
    await expect(page.getByText('Quote created successfully')).toBeVisible();
  });

  test('should update request status', async ({ page }) => {
    // Get admin credentials
    const { email, password } = getAdminTestCredentials();

    // Navigate to the application
    await page.goto('/');

    // Sign in as admin
    const loginSuccess = await signInForTest(page, email, password);
    expect(loginSuccess).toBe(true);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Find a request with "new" status
    const newRequest = page.locator('[data-status="new"]').first();

    // Click to open request details
    await newRequest.click();

    // Change status to "viewed"
    await page.selectOption('select[name="status"]', 'viewed');

    // Save changes
    await page.getByRole('button', { name: 'Update Status' }).click();

    // Verify status was updated
    await expect(page.getByText('Status updated successfully')).toBeVisible();
  });

  test('should view and manage quotes', async ({ page }) => {
    // Get admin credentials
    const { email, password } = getAdminTestCredentials();

    // Navigate to the application
    await page.goto('/');

    // Sign in as admin
    const loginSuccess = await signInForTest(page, email, password);
    expect(loginSuccess).toBe(true);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Navigate to quotes section
    await page.getByRole('tab', { name: 'Quotes' }).click();

    // Verify quotes are displayed
    await expect(page.getByText('All Quotes')).toBeVisible();

    // Find the first quote
    const firstQuote = page.locator('[data-testid="quote-item"]').first();

    // Click to view quote details
    await firstQuote.click();

    // Verify quote details
    await expect(page.getByText('Quote Details')).toBeVisible();
    await expect(page.getByText('$')).toBeVisible(); // Quote amount
  });
});