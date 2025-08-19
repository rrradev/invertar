import { initTRPC, TRPCError, type TRPCErrorShape } from "@trpc/server";
import type { Context } from "./context";
import { UserRole, type UserRoleType } from "@repo/types/users/roles";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }: { shape: TRPCErrorShape; error: TRPCError }) {
    let message = shape.message;

    if (error.code === "INTERNAL_SERVER_ERROR") {
      message = "Something went wrong";
    }

    if (error.code === "BAD_REQUEST") {
      try {
        const issues = JSON.parse(error.message);
        if (Array.isArray(issues)) {
          const messages = issues.map((issue: any) => issue.message);
          message = messages.join(", ") || "Validation error";
        }
      } catch {
        message = shape.message;
      }
    }

    if (shape.data && typeof shape.data === "object" && "stack" in shape.data) {
      // @ts-ignore
      delete shape.data.stack;
    }

    return {
      ...shape,
      message,
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    const allowedRoles: UserRoleType[] = ["ADMIN", "USER"];
    if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
);

export const adminProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  })
);

export const superAdminProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== UserRole.SUPER_ADMIN) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  })
);
