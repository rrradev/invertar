import './load-env';
import { buildServer } from './index';

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
