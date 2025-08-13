import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'@repo/api': path.resolve(__dirname, '../../apps/api'),
			'@repo/types': path.resolve(__dirname, '../../packages/types')
		}
	}
});
