import type { LayoutLoad } from './$types';
import { trpc } from '$lib/trpc';
import { user } from '$lib/stores/user';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: LayoutLoad = async ({ url }) => {
	const currentPath = url.pathname;
	const isAuthRoute = currentPath === '/login' || currentPath === '/set-password';
	const isRootRoute = currentPath === '/';
	const isSkeletonDemo = currentPath.startsWith('/skeleton-demo');

	// Skip auth checks for skeleton demo
	if (isSkeletonDemo) {
		return {
			currentPath
		};
	}

	if (isAuthRoute) {
		// On auth pages, don't call profile and set unauthenticated
		user.setUnauthenticated();
		return {
			currentPath
		};
	}

	// Check if we already have valid user data
	const currentUserState = get(user);

	// If user is already authenticated and we have user data, skip the profile call
	if (currentUserState.isAuthenticated && currentUserState.user) {
		// If on root page, redirect to dashboard
		if (isRootRoute) {
			throw redirect(302, '/dashboard');
		}

		return {
			currentPath
		};
	}

	// Set loading state only when we need to fetch user data
	user.setLoading(true);

	// For protected routes or root, check auth only if we don't have user data
	try {
		const profileResult = await trpc.auth.profile.query();

		// Set user store with profile data
		user.setUser({
			username: profileResult.username,
			organizationName: profileResult.organizationName,
			role: profileResult.role
		});

		// If on root page, redirect to dashboard
		if (isRootRoute) {
			throw redirect(302, '/dashboard');
		}

		return {
			currentPath
		};
	} catch (error: unknown) {
		// Check if it's a redirect (which we should allow)
		if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
			throw error;
		}

		// Auth failed - set unauthenticated and redirect to login
		user.setUnauthenticated();
		if (!isAuthRoute && !isRootRoute) {
			throw redirect(302, '/login');
		} else if (isRootRoute) {
			throw redirect(302, '/login');
		}

		return {
			currentPath
		};
	}
};

export const ssr = false;
