import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => path.resolve(fileURLToPath(new URL('.', import.meta.url)), p);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'@repo/types/*': r('../../packages/types/*'),
			'@repo/api': r('../../apps/api/src/')
		}
	},
	server: {
		fs: { allow: [r('../../packages'), r('../../apps/api/src/')] }
	},
	ssr: { noExternal: ['@repo/types', '@repo/api'] }
});
