import { router, publicProcedure, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "@repo/auth/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@repo/auth/jwt";
import { prisma } from "@repo/db";
import { loginInput, setPasswordWithCodeInput } from '@repo/types/schemas/auth';
import type { FastifyReply } from 'fastify';
import type { JWTPayload } from '@repo/types/auth';
import { SuccessStatus } from '@repo/types/trpc';


function setAuthCookies(reply: FastifyReply, payload: JWTPayload) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  reply.setCookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes in seconds
    path: '/',
  });

  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    path: '/trpc/auth.refreshToken',
  });

  return { accessToken, refreshToken };
}

function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie('accessToken', { path: '/' });
  reply.clearCookie('refreshToken', { path: '/' });
}

export const authRouter = router({
  login: publicProcedure
    .input(
      loginInput
    )
    .mutation(async ({ input, ctx }) => {
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
          || Date.now() > user.oneTimeAccessCodeExpiry.getTime()
        ) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired access code." });
        }

        return {
          status: SuccessStatus.VALID_ACCESS_CODE,
          userId: user.id
        };
      }

      if (!user.hashedPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password not set. Request access code." });
      }

      if (!input.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is required." });
      }

      const isValid = await verifyPassword(input.password, user.hashedPassword);
      if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });

      const payload = {
        username: user.username,
        id: user.id,
        role: user.role,
        organizationId: org.id,
      };

      const { accessToken, refreshToken } = setAuthCookies(ctx.res, payload);
      const hashedRefreshToken = await hashPassword(refreshToken);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: hashedRefreshToken,
        },
      });

      return { status: SuccessStatus.SUCCESS, accessToken };
    }),

  setPasswordWithCode: publicProcedure
    .input(
      setPasswordWithCodeInput
    )
    .mutation(async ({ input, ctx }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (
        user?.oneTimeAccessCode !== input.oneTimeAccessCode
        || !user?.oneTimeAccessCodeExpiry
        || Date.now() - user.oneTimeAccessCodeExpiry.getTime() > 24 * 60 * 60 * 1000
      )
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired access code." });

      const payload = {
        username: user.username,
        id: user.id,
        role: user.role,
        organizationId: user.organizationId,
      };

      // Set cookies through reply object
      const { refreshToken } = setAuthCookies(ctx.res, payload);

      const hashedRefreshToken = await hashPassword(refreshToken);
      const hashedPassword = await hashPassword(input.newPassword);

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          hashedPassword: hashedPassword,
          oneTimeAccessCode: null,
          oneTimeAccessCodeExpiry: null,
          refreshToken: hashedRefreshToken,
        },
      });

      return { status: SuccessStatus.PASSWORD_SET };
    }),

  refreshToken: publicProcedure
    .mutation(async ({ ctx }) => {
      const refreshToken = ctx.req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No refresh token found." });
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid refresh token." });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, username: true, role: true, organizationId: true, hashedPassword: true, refreshToken: true },
      });

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User no longer exists or is disabled." });
      }

      const isValid = await verifyPassword(refreshToken, user.refreshToken || "");
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token." });
      }

      const newPayload = {
        username: user.username,
        id: user.id,
        role: user.role,
        organizationId: user.organizationId,
      };

      const { accessToken } = setAuthCookies(ctx.res, newPayload);

      return { status: SuccessStatus.TOKEN_REFRESHED, accessToken };
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      clearAuthCookies(ctx.res);

      return { status: SuccessStatus.LOGGED_OUT };
    }),

});
