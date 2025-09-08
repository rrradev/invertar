import { writable } from 'svelte/store';
import type { UserRoleType } from '@repo/types/users';

export interface UserData {
	username: string;
	organizationName: string;
	role: UserRoleType;
}

function createUserStore() {
	const { subscribe, set, update } = writable<UserData | null>(null);

	return {
		subscribe,
		set,
		update,
		reset: () => set(null)
	};
}

export const user = createUserStore();