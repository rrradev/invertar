import type { FastifyRequest } from 'fastify';
import { verifyJwt } from '@repo/auth';

export async function createContext({ req }: { req: FastifyRequest }) {
  const token = req.headers.authorization?.split(' ')[1];
  const user = token ? verifyJwt(token) : null;

  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
