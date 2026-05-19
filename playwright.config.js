import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/system',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Start `npm run preview` before running tests, stop it after
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 15_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
