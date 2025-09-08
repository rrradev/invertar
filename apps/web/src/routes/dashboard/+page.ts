import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Wait for authentication to complete before making API calls
	await requireAuth();

	// Get dashboard data
	const result = await trpc.dashboard.getFoldersWithItems.query();

	return {
		folders: result.folders
	};
};
export const ssr = false;
