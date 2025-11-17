import { router, adminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import { createUserInput, deleteUserInput, resetUserInput } from '@repo/types/schemas/auth';
import { UserRole } from "@repo/types/users/roles";
import { generateAccessCode } from "@repo/auth/secure";
import { SuccessStatus } from '@repo/types/trpc';

export const adminRouter = router({
  listUsers: adminProcedure
    .query(async ({ ctx }) => {
      const users = await prisma.user.findMany({
        where: {
          organizationId: ctx.user!.organizationId,
          role: UserRole.USER,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          oneTimeAccessCode: true,
          oneTimeAccessCodeExpiry: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      let formatted = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
        oneTimeAccessCode: user.oneTimeAccessCode,
        oneTimeAccessCodeExpiry: user.oneTimeAccessCodeExpiry?.toISOString(),
        hasInitialPassword: Boolean(user.oneTimeAccessCode),
      }));

      return {
        status: SuccessStatus.SUCCESS,
        users: formatted,
      };
    }),

  createUser: adminProcedure
    .input(createUserInput)
    .mutation(async ({ input, ctx }) => {
      // Check if username already exists in the admin's organization
      const existingUserByUsername = await prisma.user.findUnique({
        where: {
          organizationId_username: {
            organizationId: ctx.user!.organizationId,
            username: input.username,
          },
        },
      });
      if (existingUserByUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists in this organization."
        });
      }

      const oneTimeAccessCode = generateAccessCode();
      const oneTimeAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const newUser = await prisma.user.create({
        data: {
          username: input.username,
          role: UserRole.USER,
          organizationId: ctx.user!.organizationId,
          oneTimeAccessCode,
          oneTimeAccessCodeExpiry,
        },
      });

      return {
        status: SuccessStatus.USER_CREATED,
        userId: newUser.id,
        username: newUser.username,
        oneTimeAccessCode,
        expiresAt: oneTimeAccessCodeExpiry,
      };
    }),

  deleteUser: adminProcedure
    .input(deleteUserInput)
    .mutation(async ({ input, ctx }) => {
      // First check if the user exists and is in the same organization
      const userToDelete = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { role: true, username: true, organizationId: true },
      });

      if (!userToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found."
        });
      }

      if (userToDelete.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only manage users in your organization."
        });
      }

      if (userToDelete.role !== UserRole.USER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only delete users with USER role."
        });
      }

      // Delete the user
      await prisma.user.delete({
        where: { id: input.userId },
      });

      return {
        status: SuccessStatus.USER_DELETED,
        username: userToDelete.username,
      };
    }),

  resetUser: adminProcedure
    .input(resetUserInput)
    .mutation(async ({ input, ctx }) => {
      // First check if the user exists and is in the same organization
      const userToReset = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { role: true, username: true, organizationId: true },
      });

      if (!userToReset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found."
        });
      }

      if (userToReset.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only manage users in your organization."
        });
      }

      if (userToReset.role !== UserRole.USER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only reset users with USER role."
        });
      }

      const oneTimeAccessCode = generateAccessCode();
      const oneTimeAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Reset the user by clearing password and setting new access code
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          hashedPassword: null,
          refreshToken: null,
          oneTimeAccessCode,
          oneTimeAccessCodeExpiry,
        },
      });

      return {
        status: SuccessStatus.USER_RESET,
        username: userToReset.username,
        oneTimeAccessCode,
        expiresAt: oneTimeAccessCodeExpiry,
      };
    }),
});