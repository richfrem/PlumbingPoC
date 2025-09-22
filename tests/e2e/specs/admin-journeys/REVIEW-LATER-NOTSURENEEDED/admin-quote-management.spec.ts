import { test, expect } from '@playwright/test';
import { signInForTest, getAdminTestCredentials } from '../helpers/auth';

test.describe('Admin Quote Management Journey', () => {
  test('should complete admin workflow from dashboard to scheduling', async ({ page }) => {
    const { email, password } = getAdminTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // 1. Access Command Center (Admin Dashboard)
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Verify admin dashboard loaded
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Quote Requests')).toBeVisible();

    // 2. Find and review a new request
    const newRequest = page.locator('[data-testid="request-item"]').first();
    await expect(newRequest).toBeVisible();
    await newRequest.click();

    // Verify request details modal
    await expect(page.getByText('Job Docket')).toBeVisible();

    // 3. Run AI Triage
    await page.getByRole('button', { name: 'Run Triage' }).click();
    await expect(page.getByText('Triage Summary')).toBeVisible();

    // 4. Create Quote
    await page.getByRole('button', { name: 'Create Quote' }).click();

    // Fill quote details
    await page.fill('input[name="quote_amount"]', '185.00');
    await page.fill('textarea[name="details"]',
      'Professional leak repair service including pipe inspection, leak isolation, pipe replacement, and pressure testing. Includes 90-day warranty on workmanship.'
    );
    await page.getByRole('button', { name: 'Create Quote' }).click();

    // Verify quote creation
    await expect(page.getByText('Quote created successfully')).toBeVisible();

    // 5. Add communication note
    await page.getByLabel('Add a note').fill(
      'Thank you for your request. We can schedule this repair for tomorrow morning between 9-11 AM. Please confirm if this time works for you.'
    );
    await page.getByRole('button', { name: 'Add Note' }).click();

    // Verify communication was added
    await expect(page.getByText('We can schedule this repair')).toBeVisible();

    console.log('✅ Admin quote creation and communication completed successfully!');
  });

  test('should handle quote updates and status changes', async ({ page }) => {
    const { email, password } = getAdminTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Find a request and open it
    const request = page.locator('[data-testid="request-item"]').first();
    await request.click();

    // Update request status
    await page.selectOption('select[name="status"]', 'viewed');
    await page.getByRole('button', { name: 'Update Status' }).click();
    await expect(page.getByText('Status updated successfully')).toBeVisible();

    // Create and then update a quote
    await page.getByRole('button', { name: 'Create Quote' }).click();
    await page.fill('input[name="quote_amount"]', '200.00');
    await page.fill('textarea[name="details"]', 'Updated quote with additional materials');
    await page.getByRole('button', { name: 'Create Quote' }).click();

    // Find the quote and update it
    const quoteItem = page.locator('[data-testid="quote-item"]').first();
    await quoteItem.click();

    // Update quote amount
    await page.fill('input[name="quote_amount"]', '195.00');
    await page.fill('textarea[name="details"]', 'Revised quote - included all materials and labor');
    await page.getByRole('button', { name: 'Update Quote' }).click();

    await expect(page.getByText('Quote updated successfully')).toBeVisible();

    console.log('✅ Admin quote updates and status changes completed successfully!');
  });

  test('should handle job scheduling workflow', async ({ page }) => {
    const { email, password } = getAdminTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Find an accepted quote
    const acceptedQuote = page.locator('[data-status="accepted"]').first();
    if (await acceptedQuote.count() > 0) {
      await acceptedQuote.click();

      // Schedule the job
      await page.getByRole('button', { name: 'Schedule Job' }).click();

      // Fill scheduling details
      await page.fill('input[name="scheduled_date"]', '2025-09-05');
      await page.selectOption('select[name="scheduled_time"]', '10:00');
      await page.fill('textarea[name="job_notes"]',
        'Bring complete leak repair kit, pipe wrench set, and pressure testing equipment. Customer prefers morning appointment.'
      );

      // Confirm scheduling
      await page.getByRole('button', { name: 'Confirm Schedule' }).click();
      await expect(page.getByText('Job scheduled successfully')).toBeVisible();

      // Verify scheduling details
      await expect(page.getByText('Scheduled for 2025-09-05 at 10:00')).toBeVisible();

      console.log('✅ Admin job scheduling completed successfully!');
    } else {
      console.log('ℹ️ No accepted quotes found for scheduling test');
    }
  });

  test('should handle communication log interactions', async ({ page }) => {
    const { email, password } = getAdminTestCredentials();
    await page.goto('/');
    await signInForTest(page, email, password);

    // Access admin dashboard
    await page.locator('button:has(svg.lucide-chevron-down)').click();
    await page.getByText('Command Center').click();

    // Open a request
    const request = page.locator('[data-testid="request-item"]').first();
    await request.click();

    // Add multiple communication notes
    const notes = [
      'Initial review completed. Preparing quote.',
      'Quote sent. Awaiting customer response.',
      'Customer accepted quote. Scheduling job.',
      'Job scheduled for tomorrow morning.'
    ];

    for (const note of notes) {
      await page.getByLabel('Add a note').fill(note);
      await page.getByRole('button', { name: 'Add Note' }).click();

      // Verify note was added
      await expect(page.getByText(note)).toBeVisible();
    }

    // Verify all notes are visible in communication log
    for (const note of notes) {
      await expect(page.getByText(note)).toBeVisible();
    }

    console.log('✅ Admin communication log interactions completed successfully!');
  });
});