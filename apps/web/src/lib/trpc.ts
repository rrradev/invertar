import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/api';
import { goto } from '$app/navigation';
import { loading } from '$lib/stores/loading';
import { user } from '$lib/stores/user';

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
						// Handle token refresh
						if (!isRefreshing) {
							isRefreshing = true;
							try {
								const refreshResponse = await fetch(`${getBaseUrl()}/trpc/auth.refreshToken`, {
									method: 'POST',
									credentials: 'include',
									headers: { 'Content-Type': 'application/json' }
								});
								
								// Check if refresh was successful
								if (!refreshResponse.ok) {
									throw new Error('Refresh token expired or invalid');
								}
								
								isRefreshing = false;
								refreshQueue.forEach((resolve) => resolve());
								refreshQueue = [];
							} catch (err) {
								isRefreshing = false;
								refreshQueue = [];
								user.setUnauthenticated(); // Set unauthenticated state
								goto('/login');
								throw new Error('Authentication failed - redirecting to login');
							}
						} else {
							await new Promise<void>((resolve) => refreshQueue.push(resolve));
						}

						// Retry original request
						response = await fetch(url, { ...options, credentials: 'include' });
						
						// If still unauthorized after refresh, redirect to login
						if (response.status === 401 || response.status === 403) {
							user.setUnauthenticated();
							goto('/login');
							throw new Error('Authentication failed - redirecting to login');
						}
					}

					return response;
				} finally {
					loading.set(false); // stop loading
				}
			}
		})
	]
});
