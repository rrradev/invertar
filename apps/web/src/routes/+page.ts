import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { trpc } from '$lib/trpc';

export const load: PageLoad = async () => {
    try {
        // Try to get user profile
        const profileResult = await trpc.auth.profile.query();
        
        // If we get here, user is authenticated, redirect to dashboard
        if (profileResult) {
            throw redirect(302, '/dashboard');
        }
        
        // If no profile result, redirect to login
        throw redirect(302, '/login');
    } catch (error: any) {
        // If it's already a redirect, re-throw it
        if (error?.status === 302) {
            throw error;
        }
        
        // If we get UNAUTHORIZED error (token refresh failed), redirect to login
        // This handles both TRPC errors and HTTP errors
        if (
            error?.data?.code === 'UNAUTHORIZED' || 
            error?.code === -32001 ||
            error?.message === 'UNAUTHORIZED' ||
            error?.status === 401
        ) {
            throw redirect(302, '/login');
        }
        
        // For any other error, redirect to login as well
        throw redirect(302, '/login');
    }
};

export const ssr = false;