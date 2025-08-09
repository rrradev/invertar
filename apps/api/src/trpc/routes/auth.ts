import { router, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "@repo/auth/password";
import { generateJwt } from "@repo/auth/jwt";
import { prisma } from "@repo/db";
import { loginInput, setPasswordInput } from '@repo/types/schemas/auth';
import { Success } from "@repo/types/trpc/response";

export const authRouter = router({
  login: publicProcedure
    .input(
      loginInput
    )
    .mutation(async ({ input }: { input: any }) => {
      const org = await prisma.organization.findUnique({
        where: { name: input.organizationName },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });

      const user = await prisma.user.findUnique({
        where: {
          organizationId_username: {
            organizationId: org.id,
            username: input.username,
          },
        },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });

      if (user.oneTimeAccessCode) {
        if (
          user.oneTimeAccessCode !== input.password
          || !user.oneTimeAccessCodeExpiry
          || Date.now() - user.oneTimeAccessCodeExpiry.getTime() > 24 * 60 * 60 * 1000
        ) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired access code." });
        }

        return new Success({
          status: 'SUCCESS',
          userId: user.id
        });
      }

      if (!user.hashedPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password not set. Request access code." });
      }

      if (!input.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is required." });
      }

      const isValid = await verifyPassword(input.password, user.hashedPassword);
      if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });

      const token = generateJwt({
        id: user.id,
        role: user.role,
        organizationId: org.id,
      });


      return new Success({ status: 'SUCCESS', token })
    }),

  setPasswordWithCode: publicProcedure
    .input(
      setPasswordInput
    )
    .mutation(async ({ input }: { input: any }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (
        user?.oneTimeAccessCode !== input.oneTimeAccessCode
        || !user?.oneTimeAccessCodeExpiry
        || Date.now() - user.oneTimeAccessCodeExpiry.getTime() > 24 * 60 * 60 * 1000
      )
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired access code." });

      const hashed = await hashPassword(input.newPassword);

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          hashedPassword: hashed,
          oneTimeAccessCode: null,
          oneTimeAccessCodeExpiry: null,
        },
      });

      return new Success({ status: 'PASSWORD_SET' });

    }),

});
