import { test, expect } from 'vitest';
import { req } from './config/config';
import { LoginInput } from '@repo/types/schemas/auth';
import { SuccessResponse } from '@repo/types/trpc/response';
import { TRPCError } from '@trpc/server';
import dotenv from 'dotenv';
dotenv.config();

const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;
const organizationName = process.env.SUPERADMIN_ORGANIZATION!;

const baseUrl = 'http://localhost:3000'

test('login with valid SUPER_ADMIN cred', async () => {
    const loginInput: LoginInput = {
        username,
        password,
        organizationName,
    };

    const res = await req<SuccessResponse<'SUCCESS', { token: string }>>(
        'POST',
        `${baseUrl}/trpc/auth.login`,
        loginInput
    );

    expect(res.token).toBeDefined();

        const res1 = await req<SuccessResponse<'SUCCESS', { token: string }>>(
        'POST',
        `${baseUrl}/trpc/auth.login`,
        loginInput
    );
});


test('login with invalid org', async () => {
    const loginInput: LoginInput = {
        username,
        password,
        organizationName: 'ksd',
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/auth.login`,
        loginInput
    );

    expect(res.message).toEqual('Organization not found.');
});

test('login with invalid username', async () => {
    const loginInput: LoginInput = {
        username: 'raklds',
        password: 'adas',
        organizationName
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/auth.login`,
        loginInput
    );

    expect(res.message).toEqual('User not found.');
});

test('login with invalid password', async () => {
    const loginInput: LoginInput = {
        username,
        password: 'adas',
        organizationName
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/auth.login`,
        loginInput
    );

    expect(res.message).toEqual('Invalid credentials.');
});