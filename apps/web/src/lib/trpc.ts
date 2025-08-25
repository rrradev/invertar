import { createTRPCProxyClient, httpBatchLink, retryLink } from '@trpc/client';
import type { AppRouter } from '@repo/api';
import { goto } from '$app/navigation';

const getBaseUrl = () => {
	if (typeof window !== 'undefined') {
		return 'http://localhost:3000';
	}
	return 'http://localhost:3000';
};

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${getBaseUrl()}/trpc`,
			fetch: async (url, options) => {
				const response = await fetch(url, { ...options, credentials: 'include' });

				if (response.status === 401) {
					goto('/login');
					return response;
				}

				return response;
			}
		})
	]
});
