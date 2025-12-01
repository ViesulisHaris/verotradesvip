import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel for debugging
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  /* Global setup for environment variables */
  globalSetup: require.resolve('./tests/global-setup.js'),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Pass environment variables to browser context */
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright',
    },
    
    /* Set environment variables for the browser context */
    contextOptions: {
      extraHTTPHeaders: {
        'X-Test-Environment': 'playwright',
      },
      /* Improve test isolation by disabling service workers and clearing cache */
      serviceWorkers: 'block',
      ignoreHTTPSErrors: true,
    },
    
    /* Increase timeout for better reliability */
    timeout: 60000,
    
    /* Improve navigation timeout */
    navigationTimeout: 30000,
    
    /* Improve action timeout */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});