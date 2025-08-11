import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: './tests/setup-global.ts',
  },
  define: {
    baseUrl: '"http://localhost:3000"',
  },
  resolve: {
    alias: {
      '@repo/db': resolve(__dirname, 'packages/db'),
    },
  },
});
