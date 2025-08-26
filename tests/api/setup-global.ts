import { buildServer } from '@repo/api';

let server: Awaited<ReturnType<typeof buildServer>> | undefined;

export async function setup() {
  server = buildServer();
  await server.listen({ port: 3000 });

  return async () => {
    if (server) {
      await server.close();
      console.log('Test server stopped');
    }
  };
}
