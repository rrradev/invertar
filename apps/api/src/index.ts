import './load-env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { appRouter } from './appRouter';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { createContext } from './context';
import { TRPCError } from '@trpc/server';

export function buildServer() {
  const server = Fastify({
    maxParamLength: 5000,
    logger: true,
  });

  // Register CORS with credentials support
  server.register(cors, { 
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow both dev and prod origins
    credentials: true 
  });

  // Register cookie support
  server.register(cookie, {
    secret: process.env.JWT_SECRET, // Use same secret as JWT for consistency
  });

  const trpcOptions: FastifyTRPCPluginOptions<typeof appRouter> = {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: createContext,
      onError({ path, error }) {
        server.log.error(`Error in tRPC handler on path '${path}': ${error.message}`);
      },
    },
  };

  server.register(fastifyTRPCPlugin, trpcOptions);

  server.get('/health', async (request, reply) => {
    reply.code(200).send({ status: 'ok' });
  });

  return server;
}

export { TRPCError };
export type AppRouter = typeof appRouter;