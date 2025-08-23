import { router, publicProcedure, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "@repo/auth/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@repo/auth/jwt";
import { prisma } from "@repo/db";
import { loginInput, setPasswordWithCodeInput, refreshTokenInput } from '@repo/types/schemas/auth';
import type { FastifyReply } from 'fastify';
import type { JWTPayload } from '@repo/types/auth';

// Helper function to set auth cookies
function setAuthCookies(reply: FastifyReply, payload: JWTPayload) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Set access token cookie (15 minutes, HTTP-only, secure)
  reply.setCookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes in seconds
    path: '/',
  });

  // Set refresh token cookie (30 days, HTTP-only, secure)
  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    path: '/',
  });

  return { accessToken, refreshToken };
}

// Helper function to clear auth cookies
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
          status: 'VALID_ACCESS_CODE',
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

      // Set cookies through reply object
      setAuthCookies(ctx.res, payload);

      return { status: 'SUCCESS' };
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

      const hashed = await hashPassword(input.newPassword);

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          hashedPassword: hashed,
          oneTimeAccessCode: null,
          oneTimeAccessCodeExpiry: null,
        },
      });

      const payload = {
        username: user.username,
        id: user.id,
        role: user.role,
        organizationId: user.organizationId,
      };

      // Set cookies through reply object
      setAuthCookies(ctx.res, payload);

      return { status: 'PASSWORD_SET' };
    }),

  refreshToken: publicProcedure
    .input(refreshTokenInput)
    .mutation(async ({ ctx }) => {
      // Get refresh token from cookie
      const refreshToken = ctx.req.cookies?.refreshToken;
      
      if (!refreshToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No refresh token found." });
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid refresh token." });
      }

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, username: true, role: true, organizationId: true }
      });

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User no longer exists." });
      }

      // Generate new tokens and set cookies
      const newPayload = {
        username: user.username,
        id: user.id,
        role: user.role,
        organizationId: user.organizationId,
      };

      setAuthCookies(ctx.res, newPayload);

      return { status: 'TOKEN_REFRESHED' };
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      clearAuthCookies(ctx.res);
      
      return { status: 'LOGGED_OUT' };
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      // If we get here, the user is authenticated (middleware checked)
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
      }

      // Get full user data from database
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          id: true,
          username: true,
          role: true,
          organizationId: true,
        }
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
      };
    }),

});
