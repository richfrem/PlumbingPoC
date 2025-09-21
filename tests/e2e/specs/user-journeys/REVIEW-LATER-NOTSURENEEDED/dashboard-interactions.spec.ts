import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/pages/AuthPage';
import { QuoteRequestPage } from '../page-objects/pages/QuoteRequestPage';
import { DashboardPage } from '../page-objects/pages/DashboardPage';
import { TEST_USERS, QUOTE_REQUEST_DATA } from '../../fixtures/test-data';

test.describe('Dashboard Interactions', () => {
  let authPage: AuthPage;
  let quotePage: QuoteRequestPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    quotePage = new QuoteRequestPage(page);
    dashboardPage = new DashboardPage(page);

    await page.goto('/');
  });

  test('should display customer dashboard with quote requests', async ({ page }) => {
    console.log('🧪 Testing customer dashboard display...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create a quote request first
    await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);

    // Verify we're on customer dashboard
    await dashboardPage.verifyOnCustomerDashboard();

    // Check that we have at least one request
    const requestCount = await dashboardPage.getRequestCount();
    expect(requestCount).toBeGreaterThan(0);

    console.log('✅ Customer dashboard display test passed');
  });

  test('should allow opening quote request details', async ({ page }) => {
    console.log('🧪 Testing quote request details opening...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create a quote request first
    await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);

    // Try to open the first request details
    await dashboardPage.openRequestDetailsByIndex(0);

    // Verify we're still on dashboard (modal should open)
    await dashboardPage.verifyOnCustomerDashboard();

    console.log('✅ Quote request details opening test passed');
  });

  test('should refresh dashboard and show updated requests', async ({ page }) => {
    console.log('🧪 Testing dashboard refresh functionality...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Get initial request count
    const initialCount = await dashboardPage.getRequestCount();

    // Create a new quote request
    await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.emergencyLeakRepair);

    // Refresh dashboard
    await dashboardPage.refreshDashboard();

    // Verify request count increased
    const finalCount = await dashboardPage.getRequestCount();
    expect(finalCount).toBeGreaterThan(initialCount);

    console.log('✅ Dashboard refresh test passed');
  });

  test('should find specific request by title', async ({ page }) => {
    console.log('🧪 Testing request search by title...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create a quote request with specific title
    await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);

    // Search for the request by title
    const found = await dashboardPage.findRequestByTitle('Kitchen sink leak');
    expect(found).toBe(true);

    console.log('✅ Request search by title test passed');
  });

  test('should display request status correctly', async ({ page }) => {
    console.log('🧪 Testing request status display...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create a quote request
    await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);

    // Get all visible requests
    const requests = await dashboardPage.getVisibleRequests();

    // Verify we have at least one request
    expect(requests.length).toBeGreaterThan(0);

    // Verify the first request has a status
    const firstRequest = requests[0];
    expect(firstRequest.status).toBeDefined();
    expect(firstRequest.status).not.toBe('');

    console.log('✅ Request status display test passed');
  });

  test('should handle empty dashboard state', async ({ page }) => {
    console.log('🧪 Testing empty dashboard state...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Verify dashboard loads without errors
    await dashboardPage.verifyOnCustomerDashboard();

    // Get request count (should be 0 or existing requests)
    const requestCount = await dashboardPage.getRequestCount();
    expect(requestCount).toBeGreaterThanOrEqual(0);

    console.log('✅ Empty dashboard state test passed');
  });

  test('should open and validate quote request details from My Requests', async ({ page }) => {
    // PRECONDITIONS: Quote creation must work (test: "should create basic leak repair quote request")
    // Tests that created quotes can be viewed and all key attributes are displayed correctly
    console.log('🧪 Testing quote request details validation...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create a test quote request first
    const responseData = await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);

    // Verify quote was created
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();
    const createdRequestId = responseData.request.id;

    // Refresh dashboard to show new request
    await page.reload();
    await dashboardPage.verifyOnCustomerDashboard();

    // Open the request details modal
    await dashboardPage.openRequestDetails(createdRequestId);

    // Validate all key attributes are displayed correctly
    await dashboardPage.verifyRequestDetails({
      id: createdRequestId,
      category: QUOTE_REQUEST_DATA.basicLeakRepair.category,
      problemDescription: QUOTE_REQUEST_DATA.basicLeakRepair.formData.problemDescription,
      isEmergency: QUOTE_REQUEST_DATA.basicLeakRepair.isEmergency,
      status: 'new'
    });

    // Close the modal
    await dashboardPage.closeRequestDetailsModal();

    console.log('✅ Quote request details validation test passed');
  });

  test('should display request creation date and time correctly', async ({ page }) => {
    // PRECONDITIONS: Quote creation + request details viewing must work
    // Tests that timestamps are displayed and formatted correctly
    console.log('🧪 Testing request creation date/time display...');

    // Sign in as customer
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create a test quote request
    const responseData = await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);
    const createdRequestId = responseData.request.id;

    // Refresh dashboard
    await page.reload();
    await dashboardPage.verifyOnCustomerDashboard();

    // Open request details
    await dashboardPage.openRequestDetails(createdRequestId);

    // Verify creation date is displayed and recent
    await dashboardPage.verifyRequestCreationDate();

    // Close modal
    await dashboardPage.closeRequestDetailsModal();

    console.log('✅ Request creation date/time test passed');
  });
});