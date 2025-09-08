import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';

export const load: PageLoad = async () => {
	// Get dashboard data - user profile is handled in layout
	const result = await trpc.dashboard.getFoldersWithItems.query();

	return {
		folders: result.folders
	};
};
export const ssr = false;
