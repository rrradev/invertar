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

    // Get admins data
    const result = await trpc.superAdmin.listAdmins.query();

    return {
        admins: result.admins
    };
};
export const ssr = false;