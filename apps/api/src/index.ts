import './load-env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRouter } from './appRouter';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { createContext } from './context';
import { TRPCError } from '@trpc/server';

export function buildServer() {
  const server = Fastify({
    maxParamLength: 5000,
    logger: true,
  });

  server.register(cors, { origin: true });

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