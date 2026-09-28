import { defineConfig, devices } from '@playwright/test';

const port = 5173;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    // A fixed time zone keeps date and time tests the same on every machine and in CI. For a fixed
    // "now" as well, use page.clock in the test.
    timezoneId: 'America/New_York',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Starts the Vite dev server for the tests, or reuses one you already have running locally.
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
