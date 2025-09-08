import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { trpc } from '$lib/trpc';
import { user } from '$lib/stores/user';

export const load: LayoutLoad = async ({ url }) => {
    // Only call profile for protected routes (not login/set-password pages)
    const isProtectedRoute = !url.pathname.startsWith('/login') && 
                            !url.pathname.startsWith('/set-password') &&
                            url.pathname !== '/';

    if (isProtectedRoute) {
        try {
            // Get user profile and set user store at layout level
            const profileResult = await trpc.auth.profile.query();
            user.set({
                username: profileResult.username,
                organizationName: profileResult.organizationName,
                role: profileResult.role
            });
            
            return {
                user: profileResult
            };
        } catch (error: any) {
            // If profile fails, reset user store
            user.reset();
            
            // If we get UNAUTHORIZED error (token refresh failed), redirect to login
            if (
                error?.data?.code === 'UNAUTHORIZED' || 
                error?.code === -32001 ||
                error?.message === 'UNAUTHORIZED' ||
                error?.status === 401
            ) {
                throw redirect(302, '/login');
            }
            
            // For other errors, also redirect to login
            throw redirect(302, '/login');
        }
    }

    return {};
};

export const ssr = false;