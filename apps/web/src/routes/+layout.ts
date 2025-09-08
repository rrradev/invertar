import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { user } from '$lib/stores/user';
import { get } from 'svelte/store';

export const load: LayoutLoad = async ({ url }) => {
	// Only check user store for protected routes (not login/set-password pages)
	const isProtectedRoute =
		!url.pathname.startsWith('/login') &&
		!url.pathname.startsWith('/set-password') &&
		url.pathname !== '/';

	if (isProtectedRoute) {
		// Check if user exists in store - don't make API call
		const currentUser = get(user);

		if (!currentUser) {
			// No user in store, redirect to root to trigger profile check
			throw redirect(302, '/');
		}

		return {
			user: currentUser
		};
	}

	return {};
};

export const ssr = false;
