import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: './tests/setup-global.ts',
    include: ['tests/**/*.test.ts'],
  },
});
