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
          console.warn('TRPC request timeout after 8 seconds:', url);
          controller.abort();
        }, 8000); // 8 second timeout
        
        console.log('TRPC request starting:', url);
        
        return fetch(url, {
          ...options,
          credentials: 'include', // Include cookies in requests
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
          console.log('TRPC request completed:', url);
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