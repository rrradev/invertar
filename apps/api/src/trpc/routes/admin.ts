import { router, superAdminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import { createAdminInput } from '@repo/types/schemas/auth';
import { Success } from "@repo/types/trpc/response";
import { UserRole } from "@repo/types/users/roles";
import crypto from "crypto";

export const adminRouter = router({
  createAdmin: superAdminProcedure
    .input(createAdminInput)
    .mutation(async ({ input }) => {
      const org = await prisma.organization.findUnique({
        where: { name: input.organizationName },
      });
      if (!org) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Organization not found." 
        });
      }

      // Check if username already exists in this organization
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

      // Check if email already exists in this organization
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

      // Generate a secure one-time access code
      const oneTimeAccessCode = crypto.randomBytes(16).toString('hex');
      const oneTimeAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Create the new admin user
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
        data: {
          userId: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          organizationName: input.organizationName,
          oneTimeAccessCode,
          expiresAt: oneTimeAccessCodeExpiry,
        }
      });
    }),
});