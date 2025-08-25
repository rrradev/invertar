import { test, expect } from 'vitest';
import { req } from './config/config';
import { LoginInput } from '@repo/types/schemas/auth';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';
import { SuccessStatus } from '@repo/types/trpc/successStatus';

const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;
const organizationName = process.env.SUPERADMIN_ORGANIZATION!;

const AUTH_LOGIN = 'auth.login';

test('login with valid SUPER_ADMIN cred', async () => {
    const loginInput: LoginInput = {
        username,
        password,
        organizationName,
    };

    const res = await req<SuccessResponse<{ accessToken: string }>>(
        'POST',
        AUTH_LOGIN,
        loginInput
    );

    expect(res.accessToken).toBeDefined();
    expect(res.status).toBe(SuccessStatus.SUCCESS);
});


test('login with invalid org', async () => {
    const loginInput: LoginInput = {
        username,
        password,
        organizationName: 'ksd',
    };

    const res = await req<ErrorResponse>(
        'POST',
        AUTH_LOGIN,
        loginInput
    );

    expect(res.message).toBe('Organization not found.');
});

test('login with invalid username', async () => {
    const loginInput: LoginInput = {
        username: 'raklds',
        password: 'adas',
        organizationName
    };

    const res = await req<ErrorResponse>(
        'POST',
        AUTH_LOGIN,
        loginInput
    );

    expect(res.message).toBe('User not found.');
});

test('login with invalid password', async () => {
    const loginInput: LoginInput = {
        username,
        password: 'adas',
        organizationName
    };

    const res = await req<ErrorResponse>(
        'POST',
        AUTH_LOGIN,
        loginInput
    );

    expect(res.message).toBe('Invalid credentials.');
});