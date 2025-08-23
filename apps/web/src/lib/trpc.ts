import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/api';

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
			headers() {
				const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
				return token ? { Authorization: `Bearer ${token}` } : {};
			}
		})
	]
});
