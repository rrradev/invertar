import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Wait for authentication to complete before making API calls
	await requireAuth();
	
	// Get admins data
	const result = await trpc.superAdmin.listAdmins.query();

	return {
		admins: result.admins
	};
};
export const ssr = false;
