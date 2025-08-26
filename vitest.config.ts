import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: './tests/api/setup-global.ts',
    include: ['tests/api/**/*.test.ts'],
    env: {
      BASE_URL: process.env.BASE_URL,
    },
  },
});
