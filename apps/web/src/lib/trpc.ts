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
      fetch(url, options) {
        console.log('TRPC request starting:', url);
        
        return fetch(url, {
          ...options,
          credentials: 'include', // Include cookies in requests
        }).then((response) => {
          console.log('TRPC request completed successfully:', url, response.status);
          return response;
        }).catch((error) => {
          console.log('TRPC request failed:', url, error.message);
          throw error;
        });
      },
      headers() {
        // Keep auth header support for backwards compatibility
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});