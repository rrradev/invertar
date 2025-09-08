import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { trpc } from '$lib/trpc';

export const load: PageLoad = async () => {
    // Try to get user profile
    const profileResult = await trpc.auth.profile.query();
    
    // If we get here, user is authenticated, redirect to dashboard
    if (profileResult) {
        throw redirect(302, '/dashboard');
    }
    
    // If no profile result, redirect to login
    throw redirect(302, '/login');
};

export const ssr = false;