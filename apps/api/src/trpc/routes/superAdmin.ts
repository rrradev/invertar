import { router, superAdminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import { createAdminInput } from '@repo/types/schemas/auth';
import { Success } from "@repo/types/trpc/response";
import { UserRole } from "@repo/types/users/roles";
import { generateAccessCode } from "@repo/auth/password";

export const superAdminRouter = router({
  createAdmin: superAdminProcedure
    .input(createAdminInput)
    .mutation(async ({ input }) => {
      let org = await prisma.organization.findUnique({
        where: { name: input.organizationName },
      });
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: input.organizationName,
          },
        });
      }

      const existingUserByUsername = await prisma.user.findUnique({
        where: {
          organizationId_username: {
            organizationId: org.id,
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

      const existingUserByEmail = await prisma.user.findFirst({
        where: {
          organizationId: org.id,
          email: input.email,
        },
      });
      if (existingUserByEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists in this organization."
        });
      }

      const oneTimeAccessCode = generateAccessCode();
      const oneTimeAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const newAdmin = await prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          role: UserRole.ADMIN,
          organizationId: org.id,
          oneTimeAccessCode,
          oneTimeAccessCodeExpiry,
        },
      });

      return new Success({
        status: 'ADMIN_CREATED',
        userId: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        organizationName: input.organizationName,
        oneTimeAccessCode,
        expiresAt: oneTimeAccessCodeExpiry,
      });
    }),
});