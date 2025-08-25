import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/web',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { open: 'never' }],
  ],

  webServer: [
    {
      command: 'pnpm dev:api',
      port: 3000,
      timeout: 20000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev:web',
      port: 5173,
      timeout: 20000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: !!process.env.CI,
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 15'] },
    },
  ],
});
