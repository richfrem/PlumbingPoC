import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Feature flag to control which browsers to run
const BROWSERS_ENABLED = process.env.BROWSERS_ENABLED || 'chromium'; // 'chromium', 'firefox', 'webkit', 'all'
const isCI = process.env.CI === 'true';

export default defineConfig({
  testDir: './tests/e2e', // Only run E2E tests, not unit tests
  testMatch: '**/*.spec.ts', // Only run .spec.ts files
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Conditionally include browsers based on BROWSERS_ENABLED
    ...(BROWSERS_ENABLED === 'chromium' || BROWSERS_ENABLED === 'all' ? [{
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }] : []),

    ...(BROWSERS_ENABLED === 'firefox' || BROWSERS_ENABLED === 'all' ? [{
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }] : []),

    ...(BROWSERS_ENABLED === 'webkit' || BROWSERS_ENABLED === 'all' ? [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }] : []),
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});