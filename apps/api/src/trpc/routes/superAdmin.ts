import { router, superAdminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import { createAdminInput, deleteAdminInput, refreshOTACInput, resetAdminInput } from '@repo/types/schemas/auth';
import { UserRole } from "@repo/types/users/roles";
import { generateAccessCode } from "@repo/auth/password";
import { Admin } from "@repo/types/users";

export const superAdminRouter = router({
  listAdmins: superAdminProcedure
    .query(async ({ ctx }) => {
      const admins = await prisma.user.findMany({
        where: {
          role: UserRole.ADMIN,
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          oneTimeAccessCode: true,
          oneTimeAccessCodeExpiry: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })


      let formatted = admins.map((admin: any) => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        createdAt: admin.createdAt.toISOString(),
        oneTimeAccessCode: admin.oneTimeAccessCode,
        oneTimeAccessCodeExpiry: admin.oneTimeAccessCodeExpiry?.toISOString(),
        organizationName: admin.organization?.name || 'N/A',
        hasInitialPassword: Boolean(admin.oneTimeAccessCode),
      })) as Admin[];

      return {
        status: 'SUCCESS',
        admins: formatted  ,
      };
    }),

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

      return {
        status: 'ADMIN_CREATED',
        userId: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        organizationName: input.organizationName,
        oneTimeAccessCode,
        expiresAt: oneTimeAccessCodeExpiry,
      };
    }),

  deleteAdmin: superAdminProcedure
    .input(deleteAdminInput)
    .mutation(async ({ input }) => {
      // First check if the admin exists and is actually an admin
      const adminToDelete = await prisma.user.findUnique({
        where: { id: input.adminId },
        select: { role: true, username: true },
      });

      if (!adminToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin not found."
        });
      }

      if (adminToDelete.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not an admin."
        });
      }

      // Delete the admin
      await prisma.user.delete({
        where: { id: input.adminId },
      });

      return {
        status: 'ADMIN_DELETED',
        message: `Admin ${adminToDelete.username} deleted successfully.`,
      };
    }),

  refreshOTAC: superAdminProcedure
    .input(refreshOTACInput)
    .mutation(async ({ input }) => {
      // First check if the admin exists and is actually an admin
      const adminToRefresh = await prisma.user.findUnique({
        where: { id: input.adminId },
        select: { role: true, username: true },
      });

      if (!adminToRefresh) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin not found."
        });
      }

      if (adminToRefresh.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not an admin."
        });
      }

      // Generate new OTAC and expiry
      const oneTimeAccessCode = generateAccessCode();
      const oneTimeAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update the admin with new OTAC
      const updatedAdmin = await prisma.user.update({
        where: { id: input.adminId },
        data: {
          oneTimeAccessCode,
          oneTimeAccessCodeExpiry,
        },
      });

      return {
        status: 'OTAC_REFRESHED',
        message: `OTAC refreshed for ${adminToRefresh.username}.`,
        oneTimeAccessCode,
        expiresAt: oneTimeAccessCodeExpiry.toISOString(),
      };
    }),

  resetAdmin: superAdminProcedure
    .input(resetAdminInput)
    .mutation(async ({ input }) => {
      // First check if the admin exists and is actually an admin
      const adminToReset = await prisma.user.findUnique({
        where: { id: input.adminId },
        select: { role: true, username: true },
      });

      if (!adminToReset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin not found."
        });
      }

      if (adminToReset.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not an admin."
        });
      }

      // Generate new OTAC and expiry, clear password
      const oneTimeAccessCode = generateAccessCode();
      const oneTimeAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update the admin: clear password and set new OTAC
      const updatedAdmin = await prisma.user.update({
        where: { id: input.adminId },
        data: {
          hashedPassword: null, // Clear the password
          oneTimeAccessCode,
          oneTimeAccessCodeExpiry,
        },
      });

      return {
        status: 'ADMIN_RESET',
        message: `Admin ${adminToReset.username} reset successfully. Password cleared and new OTAC generated.`,
        oneTimeAccessCode,
        expiresAt: oneTimeAccessCodeExpiry.toISOString(),
      };
    }),
});

