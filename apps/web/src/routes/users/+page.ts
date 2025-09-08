import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { requireAuth } from '$lib/auth';

export const load: PageLoad = async () => {
	// Wait for authentication to complete before making API calls
	await requireAuth();

	// Get users data
	const result = await trpc.admin.listUsers.query();

	return {
		users: result.users
	};
};
export const ssr = false;
