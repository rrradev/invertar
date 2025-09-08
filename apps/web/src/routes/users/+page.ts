import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Wait for authentication to complete before making API calls
	const user = await requireAuth();

	// If not authenticated, return empty data - layout will handle redirect
	if (!user) {
		return {
			users: []
		};
	}

	try {
		// Get users data
		const result = await trpc.admin.listUsers.query();

		return {
			users: result.users
		};
	} catch (error) {
		// If API call fails, return empty data
		console.error('Failed to load users:', error);
		return {
			users: []
		};
	}
};
export const ssr = false;
