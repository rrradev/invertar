import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRouter } from './appRouter';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
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
    onError({ path, error }: { path?: string; error: TRPCError }) {
      server.log.error(`Error in tRPC handler on path '${path}': ${error.message}`);
    },
  };

  server.register(fastifyTRPCPlugin, trpcOptions);

  server.get('/health', async (request, reply) => {
    reply.code(200).send({ status: 'ok' });
  });

  return server;
}

if (require.main === module) {
  (async () => {
    const server = buildServer();
    try {
      await server.listen({ port: 3000 });
      console.log('Server listening on port 3000');
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  })();
}
