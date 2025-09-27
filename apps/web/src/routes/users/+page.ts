import type { PageLoad } from './$types';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Only wait for authentication, don't load data here
	// Data will be loaded at component level to show skeleton during loading
	const user = await requireAuth();

	// Return immediately so navigation completes quickly
	// Component will load data and show skeleton
	return {
		users: [] // Empty initial data
	};
};
export const ssr = false;
