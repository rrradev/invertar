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
        // Add timeout to all requests to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('TRPC request timeout after 5 seconds:', url);
          controller.abort();
        }, 5000); // 5 second timeout to match auth timeout
        
        console.log('TRPC request starting:', url);
        
        return fetch(url, {
          ...options,
          credentials: 'include', // Include cookies in requests
          signal: controller.signal,
        }).then((response) => {
          clearTimeout(timeoutId);
          console.log('TRPC request completed successfully:', url);
          return response;
        }).catch((error) => {
          clearTimeout(timeoutId);
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