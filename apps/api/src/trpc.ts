import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from './context';
import { UserRoleType, UserRole } from "@repo/types/users/roles";
import z, { ZodError } from "zod";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    let message = shape.message;

    if (error.code === 'INTERNAL_SERVER_ERROR') {
      message = 'Something went wrong';
    }

    if (error.cause instanceof ZodError) {
      const messages = error.cause.issues.map(issue => issue.message).filter(Boolean);
      message = messages.join(', ') || 'Validation error';
    }

    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        stack: {}
      },
    };
  },
});


export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const allowedRoles: UserRoleType[] = ['ADMIN', 'USER'];
  if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

export const superAdminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== UserRole.SUPER_ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

