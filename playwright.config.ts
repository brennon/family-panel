import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Family Panel E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // No retries - tests should be reliable
  retries: 0,

  // Run in parallel both locally and in CI
  workers: undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation
    // Use port 3000 in CI, process.env.PORT for local (different per agent)
    baseURL: process.env.CI ? 'http://localhost:3000' : `http://localhost:${process.env.PORT || 3000}`,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // WebKit: Disabled in CI due to unfixable compatibility issues
    // Issue: Webkit parent email/password login consistently times out in CI
    // (works perfectly locally). Attempted fixes with no success:
    // - Ubuntu 22.04 instead of 24.04
    // - LIBGL_ALWAYS_SOFTWARE=true for CPU rendering
    // Root cause: Webkit WPE headless backend incompatibility with GitHub Actions
    // See: https://github.com/microsoft/playwright/issues/33057
    //      https://github.com/microsoft/playwright/issues/32151
    // Solution: Test webkit locally, skip in CI
    ...(!process.env.CI ? [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }] : []),

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    ...(!process.env.CI ? [{
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }] : []),
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    // Use port 3000 in CI, process.env.PORT for local (different per agent)
    url: process.env.CI ? 'http://localhost:3000' : `http://localhost:${process.env.PORT || 3000}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
