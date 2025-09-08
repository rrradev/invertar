import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	// Pass the current URL to the layout for auth handling
	return {
		currentPath: url.pathname
	};
};

export const ssr = false;
