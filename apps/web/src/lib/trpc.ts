import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/api';
import { goto } from '$app/navigation';
import { loading } from '$lib/stores/loading';

const getBaseUrl = () => {
	if (typeof window !== 'undefined') return 'http://localhost:3000';
	return 'http://localhost:3000';
};

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${getBaseUrl()}/trpc`,
			fetch: async (url, options) => {
				loading.set(true); // start loading
				let response;

				try {
					response = await fetch(url, { ...options, credentials: 'include' });

					if (response.status === 401 || response.status === 403) {
						// Refresh logic as before
						if (!isRefreshing) {
							isRefreshing = true;
							try {
								await fetch(`${getBaseUrl()}/trpc/auth.refreshToken`, {
									method: 'POST',
									credentials: 'include',
									headers: { 'Content-Type': 'application/json' },
								});
								isRefreshing = false;
								refreshQueue.forEach(resolve => resolve());
								refreshQueue = [];
							} catch (err) {
								isRefreshing = false;
								refreshQueue = [];
								goto('/login');
								throw err;
							}
						} else {
							await new Promise<void>((resolve) => refreshQueue.push(resolve));
						}

						// Retry original request
						response = await fetch(url, { ...options, credentials: 'include' });
					}

					return response;
				} finally {
					loading.set(false); // stop loading
				}
			},
		}),
	],
});
