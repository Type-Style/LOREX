import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './scripts/e2eConfig.js';

// Both projects use the separately running server; never start or reset it here.
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  // one generous assertion window for everything (bcrypt login, map tiles) instead of per-call timeouts
  expect: { timeout: 30000 },
  workers: 1, // Serialize real entry writes against the shared server.
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    timezoneId: 'Europe/Berlin',
    locale: 'en-US',
    colorScheme: 'light',
  },
  projects: [
    // CI installs exactly this browser (main.yml "Install playwright browser") - keep the two in sync
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'], browserName: 'chromium' } },
  ],
});
