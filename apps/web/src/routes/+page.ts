import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { trpc } from '$lib/trpc';
import { user } from '$lib/stores/user';
import { get } from 'svelte/store';

export const load: PageLoad = async () => {
    // Check if we already have user data in store
    const currentUser = get(user);
    
    if (currentUser) {
        // User already exists in store, redirect to dashboard
        throw redirect(302, '/dashboard');
    }
    
    // No user in store, attempt to get profile
    try {
        const profileResult = await trpc.auth.profile.query();
        
        // Set user store with profile data
        user.set({
            username: profileResult.username,
            organizationName: profileResult.organizationName,
            role: profileResult.role
        });
        
        // Redirect to dashboard
        throw redirect(302, '/dashboard');
    } catch (error: any) {
        // If it's already a redirect, re-throw it
        if (error?.status === 302) {
            throw error;
        }
        
        // For any error (including UNAUTHORIZED), redirect to login
        // The TRPC middleware will handle token refresh if possible
        throw redirect(302, '/login');
    }
};

export const ssr = false;