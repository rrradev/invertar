import { router } from './trpc';
import { authRouter } from './trpc/routes/auth';
import { superAdminRouter } from './trpc/routes/superAdmin';

export const appRouter = router({
  auth: authRouter,
  superAdmin: superAdminRouter,
});

export type AppRouter = typeof appRouter;
