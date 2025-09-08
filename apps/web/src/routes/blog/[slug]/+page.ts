import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';

export const load: PageLoad = async ({ params }) => {
	const result = await trpc.superAdmin.listAdmins.query();

	return {
		post: {
			admin: result.admins[0] || null,
			title: `Title for ${params.slug} goes here`,
			content: `Content for ${params.slug} goes here`
		}
	};
};
export const ssr = false;
