import { router } from './trpc';
import { authRouter } from './trpc/routes/auth';
import { superAdminRouter } from './trpc/routes/superAdmin';
import { adminRouter } from './trpc/routes/admin';
import { dashboardRouter } from './trpc/routes/dashboard';

export const appRouter = router({
  auth: authRouter,
  superAdmin: superAdminRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
