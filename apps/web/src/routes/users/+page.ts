import type { PageLoad } from './$types';
import { trpc } from '$lib/trpc';
import { user } from '$lib/stores/user';

export const load: PageLoad = async ({ params }) => {
    // Get user profile and set user store
    const profileResult = await trpc.auth.profile.query();
    user.set({
        username: profileResult.username,
        organizationName: profileResult.organizationName,
        role: profileResult.role
    });

    // Get users data
    const result = await trpc.admin.listUsers.query();

    return {
        users: result.users
    };
};
export const ssr = false;