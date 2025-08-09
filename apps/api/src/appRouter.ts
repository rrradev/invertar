import { router } from './trpc';
import { authRouter } from './trpc/routes/auth';
import { adminRouter } from './trpc/routes/admin';

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
