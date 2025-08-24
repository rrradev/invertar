import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/web',
  webServer: [
    {
      command: 'pnpm dev:api',
      port: 3000, // your API port
      timeout: 20000, // optional: wait max 20 sec
      reuseExistingServer: !process.env.CI, // skip if already running
    },
    {
      command: 'pnpm dev:web',
      port: 5173, // your web dev server port
      timeout: 20000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: {
    baseURL: 'http://localhost:5173', // your web URL
    trace: 'on-first-retry',
    headless: false,
  },
});
