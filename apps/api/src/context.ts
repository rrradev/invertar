import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '@repo/auth';

export async function createContext({ req, res }: { req: FastifyRequest; res: FastifyReply }) {
  // Try to get token from Authorization header first (for backwards compatibility)
  let token = req.headers.authorization?.split(' ')[1];
  
  // If no header token, try to get access token from cookie
  if (!token) {
    token = req.cookies?.accessToken;
  }
  
  const user = token ? verifyAccessToken(token) : null;

  return { user, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
