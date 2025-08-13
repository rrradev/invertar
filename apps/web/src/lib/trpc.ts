import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/appRouter';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  return `http://localhost:3000`; // dev SSR should use localhost
};

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});