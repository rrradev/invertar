import { writable } from 'svelte/store';
import type { JWTPayload } from '@repo/types/auth/jwt';

export interface AuthState {
	user: JWTPayload | null;
	isLoading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isLoading: true
	});

	return {
		subscribe,
		set,
		update,
		reset: () => set({ user: null, isLoading: false })
	};
}

export const auth = createAuthStore();
