import { router } from './trpc';
import { authRouter } from './trpc/routes/auth';

export const appRouter = router({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
