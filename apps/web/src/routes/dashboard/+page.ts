import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Wait for authentication to complete before making API calls
	const user = await requireAuth();

	// If not authenticated, return empty data - layout will handle redirect
	if (!user) {
		return {
			shelves: []
		};
	}

	try {
		// Get dashboard data
		const result = await trpc.dashboard.getShelvesWithItems.query();

		return {
			shelves: result.shelves
		};
	} catch (error) {
		// If API call fails, return empty data
		console.error('Failed to load dashboard data:', error);
		return {
			shelves: []
		};
	}
};
export const ssr = false;
