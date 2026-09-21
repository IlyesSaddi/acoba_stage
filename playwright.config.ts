import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'src/generated-tests',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
