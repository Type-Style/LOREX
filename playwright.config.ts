import { defineConfig, devices } from '@playwright/test';

// E2E smoke tests in a real browser against the running dev server -
// same convention as the Jest suite: start the app separately first (http://localhost:80).
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  // one generous assertion window for everything (bcrypt login, map tiles) instead of per-call timeouts
  expect: { timeout: 30000 },
  workers: 1, // the map test may seed data; keep runs deterministic
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:80',
    trace: 'retain-on-failure',
  },
  projects: [
    // CI installs exactly this browser (main.yml "Install playwright browser") - keep the two in sync
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
