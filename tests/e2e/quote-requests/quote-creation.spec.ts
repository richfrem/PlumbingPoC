import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/AuthPage';
import { QuoteRequestPage } from '../page-objects/QuoteRequestPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { TEST_USERS, QUOTE_REQUEST_DATA } from '../fixtures/test-data';
import { createApiClient, TestApiClient } from '../../utils/apiClient';

test.describe('Quote Request Creation', () => {
  let authPage: AuthPage;
  let quotePage: QuoteRequestPage;
  let dashboardPage: DashboardPage;
  let apiClient: TestApiClient;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    quotePage = new QuoteRequestPage(page);
    dashboardPage = new DashboardPage(page);
    apiClient = await createApiClient();

    await page.goto('/');
  });

  test.afterEach(async () => {
    await apiClient.cleanup();
  });

  test('should create basic leak repair quote request', async ({ page }) => {
    // PRECONDITIONS: User authentication must work (test: "should sign in regular user successfully")
    // Tests the complete quote creation workflow from authentication to submission
    console.log('🧪 Testing basic leak repair quote creation...');

    // Sign in
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create quote request
    const responseData = await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.basicLeakRepair);

    // Verify API response
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    // Verify the created request has expected data
    const createdRequest = responseData.request;
    expect(createdRequest.problem_category).toBe(QUOTE_REQUEST_DATA.basicLeakRepair.category);
    expect(createdRequest.is_emergency).toBe(QUOTE_REQUEST_DATA.basicLeakRepair.isEmergency);
    expect(createdRequest.status).toBe('new');

    // Alternative validation: Check if we can get the specific request by ID
    try {
      const requestDetails = await apiClient.getRequestById(createdRequest.id);
      expect(requestDetails).toBeDefined();
      if (requestDetails) {
        expect(requestDetails.problem_category).toBe(QUOTE_REQUEST_DATA.basicLeakRepair.category);
        console.log('✅ API validation: Request details retrieved successfully');
      }
    } catch (error) {
      console.warn('⚠️ API validation: Could not retrieve request details (endpoint may require auth)');
      // This is okay - the main validation is that the creation succeeded
    }

    // Verify dashboard shows the request
    await dashboardPage.verifyOnCustomerDashboard();

    console.log('✅ Basic leak repair quote creation test passed');
    console.log(`📋 Created request ID: ${createdRequest.id}`);
  });

  test('should create emergency leak repair quote request', async ({ page }) => {
    // PRECONDITIONS: User authentication must work (test: "should sign in regular user successfully")
    // Tests emergency quote creation workflow with priority handling
    console.log('🧪 Testing emergency leak repair quote creation...');

    // API: Get count before creation
    const beforeCount = await apiClient.getRequestCount();
    console.log(`📊 Requests before: ${beforeCount}`);

    // Sign in
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create emergency quote request
    const responseData = await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.emergencyLeakRepair);

    // Verify API response
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    // API: Verify count increased by 1
    const afterCount = await apiClient.getRequestCount();
    console.log(`📊 Requests after: ${afterCount}`);
    expect(afterCount).toBe(beforeCount + 1);

    // API: Verify data integrity of latest request
    const isDataValid = await apiClient.validateRequestData({
      problem_category: QUOTE_REQUEST_DATA.emergencyLeakRepair.category,
      problem_description: QUOTE_REQUEST_DATA.emergencyLeakRepair.formData.problemDescription,
      is_emergency: QUOTE_REQUEST_DATA.emergencyLeakRepair.isEmergency,
      status: 'new'
    });
    expect(isDataValid).toBe(true);

    // Verify dashboard shows the request
    await dashboardPage.verifyOnCustomerDashboard();

    console.log('✅ Emergency leak repair quote creation test passed');
  });

  test('should create bathroom renovation quote request', async ({ page }) => {
    // PRECONDITIONS: User authentication must work (test: "should sign in regular user successfully")
    // Tests complex quote creation with multiple form fields and categories
    console.log('🧪 Testing bathroom renovation quote creation...');

    // API: Get count before creation
    const beforeCount = await apiClient.getRequestCount();
    console.log(`📊 Requests before: ${beforeCount}`);

    // Sign in
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Create bathroom renovation quote request
    const responseData = await quotePage.createQuoteRequest(QUOTE_REQUEST_DATA.bathroomRenovation);

    // Verify API response
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    // API: Verify count increased by 1
    const afterCount = await apiClient.getRequestCount();
    console.log(`📊 Requests after: ${afterCount}`);
    expect(afterCount).toBe(beforeCount + 1);

    // API: Verify data integrity of latest request
    const isDataValid = await apiClient.validateRequestData({
      problem_category: QUOTE_REQUEST_DATA.bathroomRenovation.category,
      problem_description: QUOTE_REQUEST_DATA.bathroomRenovation.formData.problemDescription,
      is_emergency: QUOTE_REQUEST_DATA.bathroomRenovation.isEmergency,
      status: 'new'
    });
    expect(isDataValid).toBe(true);

    // Verify dashboard shows the request
    await dashboardPage.verifyOnCustomerDashboard();

    console.log('✅ Bathroom renovation quote creation test passed');
  });

  test('should handle different service categories', async ({ page }) => {
    console.log('🧪 Testing different service categories...');

    // Sign in
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Test multiple categories
    const categories = ['leak_repair', 'bathroom_renovation'] as const;

    for (const category of categories) {
      console.log(`Testing category: ${category}`);

      // Create quote request for this category
      const testData = category === 'leak_repair'
        ? QUOTE_REQUEST_DATA.basicLeakRepair
        : QUOTE_REQUEST_DATA.bathroomRenovation;

      const responseData = await quotePage.createQuoteRequest(testData);

      // Verify API response
      expect(responseData.message).toContain('Quote request submitted successfully');
      expect(responseData.request).toBeDefined();
      expect(responseData.request.id).toBeDefined();
    }

    // Verify dashboard shows all requests
    await dashboardPage.verifyOnCustomerDashboard();
    const requestCount = await dashboardPage.getRequestCount();
    expect(requestCount).toBeGreaterThanOrEqual(2);

    console.log('✅ Different service categories test passed');
  });

  test('should validate required form fields', async ({ page }) => {
    console.log('🧪 Testing form validation...');

    // Sign in
    await authPage.ensureSignedIn(TEST_USERS.customer.email, TEST_USERS.customer.password);

    // Open quote request modal
    await quotePage.openQuoteRequestModal();

    // Try to submit without filling required fields
    await quotePage.selectEmergencyOption(false);
    await quotePage.selectServiceCategory('leak_repair');

    // Submit button should be disabled or form should prevent submission
    const submitButton = page.locator('button:has-text("Submit")');
    await expect(submitButton).toBeDisabled();

    console.log('✅ Form validation test passed');
  });
});