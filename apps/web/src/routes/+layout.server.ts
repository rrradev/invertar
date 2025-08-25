import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { config } from 'dotenv';

config({ path: '../../../.env' });

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLoginPage = url.pathname === '/login';
  const isSetPasswordPage = url.pathname === '/set-password';

  if (!locals.user && locals.shouldRequestNewTokens && !isLoginPage && !isSetPasswordPage) {
    throw redirect(302, '/login');
  }

  return {
    user: locals.user,
    hasRefreshToken: locals.shouldRequestNewTokens
  };
};


