import { get } from 'svelte/store';
import { user, type AuthState } from '$lib/stores/user';

/**
 * Wait for authentication to complete and return the auth state
 * Used by page load functions to ensure auth is handled before making API calls
 */
export async function waitForAuth(): Promise<AuthState> {
	return new Promise((resolve) => {
		// Check if auth is already complete
		const currentState = get(user);
		if (!currentState.isLoading) {
			resolve(currentState);
			return;
		}

		// Subscribe to auth state changes
		const unsubscribe = user.subscribe((state) => {
			if (!state.isLoading) {
				unsubscribe();
				resolve(state);
			}
		});
	});
}

/**
 * Get the current user data, returning null if not authenticated
 * Used by page load functions that require authentication
 * Since auth now happens in layout load function, this should return immediately
 */
export async function requireAuth() {
	// Auth should already be complete when page load functions run
	// since layout load function runs first
	const authState = get(user);

	if (!authState.isAuthenticated || !authState.user) {
		// Return null to indicate auth failure
		return null;
	}

	return authState.user;
}
