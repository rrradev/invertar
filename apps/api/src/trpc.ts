import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from './context';
import { UserRole, UserRoleType } from "@repo/types/users/roles";
import z, { ZodError } from "zod";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }: { shape: any; error: any }) {
    let message = shape.message;

    if (error.code === 'INTERNAL_SERVER_ERROR') {
      message = 'Something went wrong';
    }

    if(error.cause instanceof ZodError) {
      message = '';
    }

    return {
      ...shape,
      message,
      data: {
        zodError: error.cause instanceof ZodError
          ? z.treeifyError(error.cause)
          : null,
      },
    };
  },
});


export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }: { ctx: Context; next: MiddlewareFunction }) => {
  const allowedRoles: UserRoleType[] = ['ADMIN', 'USER'];
  if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const adminProcedure = t.procedure.use(({ ctx, next }: { ctx: Context; next: any }) => {
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

export const superAdminProcedure = t.procedure.use(({ ctx, next }: { ctx: Context; next: any }) => {
  if (!ctx.user || ctx.user.role !== UserRole.SUPER_ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

