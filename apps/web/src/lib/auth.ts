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
 * Get the current user data, throwing an error if not authenticated
 * Used by page load functions that require authentication
 */
export async function requireAuth() {
	const authState = await waitForAuth();
	
	if (!authState.isAuthenticated || !authState.user) {
		throw new Error('User not authenticated');
	}
	
	return authState.user;
}