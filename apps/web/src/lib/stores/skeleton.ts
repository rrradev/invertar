import { writable } from 'svelte/store';

// Store to manage skeleton loading states for different pages
interface SkeletonState {
	dashboard: boolean;
	users: boolean;
	admins: boolean;
}

const initialState: SkeletonState = {
	dashboard: false,
	users: false,
	admins: false
};

function createSkeletonStore() {
	const { subscribe, set, update } = writable<SkeletonState>(initialState);

	return {
		subscribe,
		showSkeleton: (page: keyof SkeletonState) => update((state) => ({ ...state, [page]: true })),
		hideSkeleton: (page: keyof SkeletonState) => update((state) => ({ ...state, [page]: false })),
		hideAllSkeletons: () => set(initialState),
		reset: () => set(initialState)
	};
}

export const skeleton = createSkeletonStore();
