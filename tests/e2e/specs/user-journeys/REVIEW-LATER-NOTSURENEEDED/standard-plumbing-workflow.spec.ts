import { test, expect } from '@playwright/test';
import { signInForTest, getTestCredentials, getAdminTestCredentials } from '../helpers/auth';

test.describe('Standard Plumbing Service Workflow', () => {
  test('should complete full plumbing service workflow from quote to scheduling', async ({ browser }) => {
    // Create browser contexts for customer and admin
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const customerPage = await customerContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      // === PHASE 1: Customer Creates Quote Request ===

      const { email: customerEmail, password: customerPassword } = getTestCredentials();

      // Customer signs in and creates quote request
      await customerPage.goto('/');
      await signInForTest(customerPage, customerEmail, customerPassword);

      // Start quote request
      await customerPage.getByRole('button', { name: 'Request a Quote' }).click();

      // Emergency triage - No emergency
      await customerPage.getByRole('button', { name: 'No' }).click();

      // Select service category
      await customerPage.getByRole('button', { name: 'Leak Repair' }).click();

      // Question 1: Property type (Material-UI Select dropdown)
      await customerPage.getByLabel('What is the property type?').click();
      await customerPage.getByRole('option', { name: 'Residential' }).click();
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Question 2: Are you the homeowner? (Material-UI Select dropdown)
      await customerPage.getByLabel('Are you the homeowner?').click();
      await customerPage.getByRole('option', { name: 'Yes' }).click();
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Question 3: Problem description (textarea)
      await customerPage.getByLabel('Please describe the general problem.').fill(
        'Water leaking from under kitchen sink. Slow drip that has been ongoing for a week.'
      );
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Question 4: Preferred timing (text input)
      await customerPage.getByRole('textbox').fill('ASAP - this week if possible');
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Question 5: Additional notes (textarea)
      await customerPage.getByLabel('Additional notes (specify "none" if not applicable):').fill(
        'The leak is in the main kitchen. Access is available during business hours.'
      );
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Answer AI follow-up questions
      await customerPage.getByRole('textbox').fill('Under the kitchen sink cabinet');
      await customerPage.getByRole('button', { name: 'Send' }).click();

      await customerPage.getByRole('textbox').fill('Slow but steady drip');
      await customerPage.getByRole('button', { name: 'Send' }).click();

      // Submit the quote request
      await customerPage.getByRole('button', { name: 'Confirm & Submit Request' }).click();
      await expect(customerPage.getByText('Thank you!')).toBeVisible();

      // Customer adds a note to communication log
      await customerPage.getByRole('button', { name: 'My Requests' }).click();
      const customerRequest = customerPage.locator('[data-testid="request-item"]').first();
      await customerRequest.click();

      // Add communication note
      await customerPage.getByLabel('Add a note').fill('Please call me at 555-0123 when you arrive. The sink is in the main kitchen.');
      await customerPage.getByRole('button', { name: 'Add Note' }).click();

      // === PHASE 2: Admin Reviews and Processes Request ===

      const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();

      // Admin signs in
      await adminPage.goto('/');
      await signInForTest(adminPage, adminEmail, adminPassword);

      // Access admin dashboard
      await adminPage.locator('button:has(svg.lucide-chevron-down)').click();
      await adminPage.getByText('Command Center').click();

      // Find and open the new request
      const newRequest = adminPage.locator('[data-testid="request-item"]').first();
      await expect(newRequest).toContainText('Leak Repair');
      await newRequest.click();

      // Review request details
      await expect(adminPage.getByText('Job Docket')).toBeVisible();
      await expect(adminPage.getByText('Water leaking from under kitchen sink')).toBeVisible();

      // Run AI triage
      await adminPage.getByRole('button', { name: 'Run Triage' }).click();
      await expect(adminPage.getByText('Triage Summary')).toBeVisible();

      // Create quote
      await adminPage.getByRole('button', { name: 'Create Quote' }).click();
      await adminPage.fill('input[name="quote_amount"]', '185.00');
      await adminPage.fill('textarea[name="details"]',
        'Leak repair service including pipe inspection, leak isolation, pipe replacement, and pressure testing. Includes 90-day warranty on workmanship.'
      );
      await adminPage.getByRole('button', { name: 'Create Quote' }).click();
      await expect(adminPage.getByText('Quote created successfully')).toBeVisible();

      // Reply to communication log
      await adminPage.getByLabel('Add a note').fill('Thank you for the details. We will arrive between 9-11 AM tomorrow. Please ensure access to under-sink area.');
      await adminPage.getByRole('button', { name: 'Add Note' }).click();

      // === PHASE 3: Customer Accepts Quote ===

      // Customer sees the quote and communication
      await customerPage.reload();
      await customerPage.getByRole('button', { name: 'My Requests' }).click();

      const customerRequestWithQuote = customerPage.locator('[data-testid="request-item"]').first();
      await customerRequestWithQuote.click();

      // Verify quote details
      await expect(customerPage.getByText('$185.00')).toBeVisible();
      await expect(customerPage.getByText('Leak repair service')).toBeVisible();

      // Check admin's communication
      await expect(customerPage.getByText('We will arrive between 9-11 AM')).toBeVisible();

      // Accept the quote
      await customerPage.getByRole('button', { name: 'Accept Quote' }).click();
      await expect(customerPage.getByText('Quote accepted successfully')).toBeVisible();

      // === PHASE 4: Admin Schedules the Job ===

      // Admin sees the accepted quote
      await adminPage.reload();

      // Find the accepted quote
      const acceptedQuote = adminPage.locator('[data-status="accepted"]').first();
      await expect(acceptedQuote).toBeVisible();
      await acceptedQuote.click();

      // Schedule the job
      await adminPage.getByRole('button', { name: 'Schedule Job' }).click();

      // Select date and time
      await adminPage.fill('input[name="scheduled_date"]', '2025-09-05');
      await adminPage.selectOption('select[name="scheduled_time"]', '10:00');
      await adminPage.fill('textarea[name="job_notes"]', 'Bring pipe wrench and leak detection equipment. Customer prefers morning appointment.');

      // Confirm scheduling
      await adminPage.getByRole('button', { name: 'Confirm Schedule' }).click();
      await expect(adminPage.getByText('Job scheduled successfully')).toBeVisible();

      // Verify final status
      await expect(adminPage.getByText('Scheduled for 2025-09-05 at 10:00')).toBeVisible();

      console.log('✅ Complete plumbing service workflow test passed!');

    } finally {
      // Clean up browser contexts
      await customerContext.close();
      await adminContext.close();
    }
  });
});