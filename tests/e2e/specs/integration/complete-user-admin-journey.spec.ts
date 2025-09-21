import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials, getAdminTestCredentials } from '../helpers/auth';

test.describe('Complete User-to-Admin Workflow', () => {
  test('should complete full journey from customer quote to admin processing', async ({ browser }) => {
    // Create two browser contexts - one for customer, one for admin
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const customerPage = await customerContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      // === PHASE 1: Customer Creates Quote Request ===

      // Get customer credentials
      const { email: customerEmail, password: customerPassword } = getTestCredentials();

      // Customer navigates to app
      await customerPage.goto('/');

      // Customer signs in
      const customerLoginSuccess = await signInForTest(customerPage, customerEmail, customerPassword);
      expect(customerLoginSuccess).toBe(true);

      // Customer starts quote request
      await customerPage.getByRole('button', { name: 'Request a Quote' }).click();

      // Emergency triage
      await customerPage.getByRole('button', { name: 'No' }).click();

      // Service selection
      await customerPage.getByRole('button', { name: 'Leak Repair' }).click();

      // Fill out request details
      await customerPage.getByRole('button', { name: 'House' }).click();
      await customerPage.getByRole('button', { name: 'Yes' }).click();

      await customerPage.getByLabel('Please describe the general problem.').fill(
        'Kitchen sink is leaking under the cabinet'
      );

      await customerPage.getByRole('button', { name: 'Send' }).click();

      // AI follow-up questions
      await customerPage.getByRole('textbox').fill('Under the kitchen sink');
      await customerPage.getByRole('button', { name: 'Send' }).click();

      await customerPage.getByRole('textbox').fill('Water is dripping steadily');
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Submit quote request
      await customerPage.getByRole('button', { name: 'Confirm & Submit Request' }).click();

      // Verify submission success
      await expect(customerPage.getByText('Thank you!')).toBeVisible();

      // === PHASE 2: Admin Processes the Request ===

      // Get admin credentials
      const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();

      // Admin navigates to app
      await adminPage.goto('/');

      // Admin signs in
      const adminLoginSuccess = await signInForTest(adminPage, adminEmail, adminPassword);
      expect(adminLoginSuccess).toBe(true);

      // Admin accesses command center
      await adminPage.locator('button:has(svg.lucide-chevron-down)').click();
      await adminPage.getByText('Command Center').click();

      // Admin views the new request
      await expect(adminPage.getByText('Quote Requests')).toBeVisible();

      // Find the newly created request (should be at the top)
      const newRequest = adminPage.locator('[data-testid="quote-request-item"]').first();
      await expect(newRequest).toContainText('Leak Repair');

      // Admin opens request details
      await newRequest.click();

      // Verify request details
      await expect(adminPage.getByText('Job Docket')).toBeVisible();
      await expect(adminPage.getByText('Kitchen sink is leaking')).toBeVisible();

      // Admin creates a quote
      await adminPage.getByRole('button', { name: 'Create Quote' }).click();

      // Fill quote details
      await adminPage.fill('input[name="quote_amount"]', '275.00');
      await adminPage.fill('textarea[name="details"]',
        'Complete leak repair including pipe replacement, sealant, and testing. Includes 1-year warranty.'
      );

      // Submit quote
      await adminPage.getByRole('button', { name: 'Create Quote' }).click();

      // Verify quote creation
      await expect(adminPage.getByText('Quote created successfully')).toBeVisible();

      // === PHASE 3: Customer Receives and Accepts Quote ===

      // Customer navigates back to their requests
      await customerPage.reload();

      // Customer should see the quote
      await expect(customerPage.getByText('My Requests')).toBeVisible();

      // Find their request with quote
      const customerRequest = customerPage.locator('[data-testid="quote-request-item"]').first();
      await expect(customerRequest).toContainText('Quoted');

      // Customer views quote details
      await customerRequest.click();

      // Verify quote details are visible
      await expect(customerPage.getByText('$275.00')).toBeVisible();
      await expect(customerPage.getByText('Complete leak repair')).toBeVisible();

      // Customer accepts the quote
      await customerPage.getByRole('button', { name: 'Accept Quote' }).click();

      // Verify acceptance
      await expect(customerPage.getByText('Quote accepted successfully')).toBeVisible();

      // === PHASE 4: Admin Sees Quote Acceptance ===

      // Admin refreshes dashboard
      await adminPage.reload();

      // Admin should see the accepted quote
      const acceptedRequest = adminPage.locator('[data-status="accepted"]').first();
      await expect(acceptedRequest).toBeVisible();

      console.log('✅ Complete workflow test passed!');

    } finally {
      // Clean up browser contexts
      await customerContext.close();
      await adminContext.close();
    }
  });

  test('should handle admin quote rejection workflow', async ({ browser }) => {
    // Create browser contexts
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const customerPage = await customerContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      // Customer creates request (similar to above)
      const { email: customerEmail, password: customerPassword } = getTestCredentials();
      await customerPage.goto('/');
      await signInForTest(customerPage, customerEmail, customerPassword);

      // Quick request creation
      await customerPage.getByRole('button', { name: 'Request a Quote' }).click();
      await customerPage.getByRole('button', { name: 'No' }).click();
      await customerPage.getByRole('button', { name: 'Bathroom Renovation' }).click();
      await customerPage.getByRole('button', { name: 'House' }).click();
      await customerPage.getByRole('button', { name: 'Yes' }).click();
      await customerPage.getByLabel('Please describe the general problem.').fill('Bathroom renovation needed');
      await customerPage.getByRole('button', { name: 'Send' }).click();
      await customerPage.getByRole('button', { name: 'Confirm & Submit Request' }).click();

      // Admin processes and rejects
      const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();
      await adminPage.goto('/');
      await signInForTest(adminPage, adminEmail, adminPassword);

      await adminPage.locator('button:has(svg.lucide-chevron-down)').click();
      await adminPage.getByText('Command Center').click();

      // Create and then reject quote
      const request = adminPage.locator('[data-testid="quote-request-item"]').first();
      await request.click();

      await adminPage.getByRole('button', { name: 'Create Quote' }).click();
      await adminPage.fill('input[name="quote_amount"]', '500.00');
      await adminPage.fill('textarea[name="details"]', 'High quote for renovation work');
      await adminPage.getByRole('button', { name: 'Create Quote' }).click();

      // Admin rejects the quote
      await adminPage.getByRole('button', { name: 'Reject Quote' }).click();
      await adminPage.fill('textarea[name="rejection_reason"]', 'Quote too high for initial estimate');
      await adminPage.getByRole('button', { name: 'Confirm Rejection' }).click();

      // Verify rejection
      await expect(adminPage.getByText('Quote rejected')).toBeVisible();

    } finally {
      await customerContext.close();
      await adminContext.close();
    }
  });
});