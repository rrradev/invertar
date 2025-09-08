import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Auth handling is done in layout.svelte
	// This page will be redirected by layout if authenticated
	return {};
};

export const ssr = false;
