import type { FastifyRequest } from 'fastify';
export declare function createContext({ req }: {
    req: FastifyRequest;
}): Promise<{
    user: any;
}>;
export type Context = Awaited<ReturnType<typeof createContext>>;
