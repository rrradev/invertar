import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';

export const load: PageLoad = async () => {
	// Get admins data - user profile is handled in layout
	const result = await trpc.superAdmin.listAdmins.query();

	return {
		admins: result.admins
	};
};
export const ssr = false;
