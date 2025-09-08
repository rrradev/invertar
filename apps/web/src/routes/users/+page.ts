import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';

export const load: PageLoad = async ({ params }) => {
    // Get users data - user profile is handled in layout
    const result = await trpc.admin.listUsers.query();

    return {
        users: result.users
    };
};
export const ssr = false;