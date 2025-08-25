import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
/** @type {import('@sveltejs/kit').Config} */

export default {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'@repo/types/*': '../../packages/types/*',
			'@repo/api': '../../apps/api/src/',
			'@repo/auth': '../../packages/auth/src/',
		}
	}
};
