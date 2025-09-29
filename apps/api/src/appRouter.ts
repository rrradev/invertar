import { router } from './trpc';
import { authRouter } from './trpc/routes/auth';
import { superAdminRouter } from './trpc/routes/superAdmin';
import { adminRouter } from './trpc/routes/admin';
import { dashboardRouter } from './trpc/routes/dashboard';
import { imagesRouter } from './trpc/routes/images';

export const appRouter = router({
  auth: authRouter,
  superAdmin: superAdminRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
  images: imagesRouter,
});

export type AppRouter = typeof appRouter;
