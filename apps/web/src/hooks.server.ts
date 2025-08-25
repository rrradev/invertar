import type { JWTPayload } from '@repo/types/auth';
import type { Handle } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';

export const handle: Handle = async ({ event, resolve }) => {
    const accessToken = event.cookies.get('accessToken');

    if (accessToken) {
        const payload = jwtDecode<JWTPayload>(accessToken);
        event.locals.user = payload ?? null;
        event.locals.shouldRequestNewTokens = false;
    }

    if (event.url.pathname.startsWith('/trpc/auth.refreshToken')) {
        const refreshToken = event.cookies.get('refreshToken');
        if (!refreshToken) {
            event.locals.user = null;
            event.locals.shouldRequestNewTokens = true;
        }
    }


    return resolve(event);
};
