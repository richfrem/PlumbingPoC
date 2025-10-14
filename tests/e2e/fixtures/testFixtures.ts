import { test as base } from '@playwright/test';
import { TestApiClient } from '../../utils/apiClient';
import { AuthPage } from '../page-objects/AuthPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { ProfilePage } from '../page-objects/ProfilePage';
import { QuoteRequestPage } from '../page-objects/QuoteRequestPage';

// Extend the base test with fixtures
export const test = base.extend<{
  apiClient: TestApiClient;
  authPage: AuthPage;
  dashboardPage: DashboardPage;
  profilePage: ProfilePage;
  quoteRequestPage: QuoteRequestPage;
}>({
  // API Client fixture
  apiClient: async ({}, use) => {
    const client = new TestApiClient();
    await client.init();

    await use(client);

    // Cleanup
    await client.cleanup();
  },

  // Page Object fixtures
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  profilePage: async ({ page }, use) => {
    const profilePage = new ProfilePage(page);
    await use(profilePage);
  },

  quoteRequestPage: async ({ page }, use) => {
    const quoteRequestPage = new QuoteRequestPage(page);
    await use(quoteRequestPage);
  },
});

export { expect } from '@playwright/test';
