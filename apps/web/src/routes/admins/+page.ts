import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Wait for authentication to complete before making API calls
	const user = await requireAuth();

	// If not authenticated, return empty data - layout will handle redirect
	if (!user) {
		return {
			admins: []
		};
	}

	try {
		// Get admins data
		const result = await trpc.superAdmin.listAdmins.query();

		return {
			admins: result.admins
		};
	} catch (error) {
		// If API call fails, return empty data
		console.error('Failed to load admins:', error);
		return {
			admins: []
		};
	}
};
export const ssr = false;
