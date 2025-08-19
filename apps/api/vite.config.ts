import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    ssr: true,
    rollupOptions: {
      input: 'src/index.ts'
    }
  }
});
