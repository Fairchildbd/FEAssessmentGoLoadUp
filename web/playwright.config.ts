import { defineConfig, devices } from '@playwright/test';

const port = 5173;
// Adjust this value to slow down the e2e tests in --headed mode.
const millisecondsBetweenActions = Number(process.env.SLOW_MO ?? 0);

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    timezoneId: 'America/New_York',
    trace: 'on-first-retry',
    launchOptions: { slowMo: millisecondsBetweenActions },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
