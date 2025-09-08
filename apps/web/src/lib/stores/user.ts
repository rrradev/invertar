import { writable } from 'svelte/store';
import type { UserRoleType } from '@repo/types/users';

export interface UserData {
	username: string;
	organizationName: string;
	role: UserRoleType;
}

// Create an auth state store to track authentication status
export interface AuthState {
	isLoading: boolean;
	user: UserData | null;
	isAuthenticated: boolean;
}

function createUserStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isLoading: true,
		user: null,
		isAuthenticated: false
	});

	return {
		subscribe,
		setUser: (userData: UserData) => {
			set({
				isLoading: false,
				user: userData,
				isAuthenticated: true
			});
		},
		setLoading: (loading: boolean) => {
			update(state => ({
				...state,
				isLoading: loading
			}));
		},
		setUnauthenticated: () => {
			set({
				isLoading: false,
				user: null,
				isAuthenticated: false
			});
		},
		reset: () => set({
			isLoading: true,
			user: null,
			isAuthenticated: false
		})
	};
}

export const user = createUserStore();
