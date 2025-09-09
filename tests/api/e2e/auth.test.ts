import { test, expect } from 'vitest';
import { req, getToken } from './config/config';
import { LoginInput } from '@repo/types/schemas/auth';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';
import { SuccessStatus } from '@repo/types/trpc/successStatus';
import { UserRole } from '@repo/types/users/roles';
import { parsedEnv } from '../../utils/envSchema';

const username = parsedEnv.SUPERADMIN_USERNAME;
const password = parsedEnv.SUPERADMIN_PASSWORD;
const organizationName = parsedEnv.SUPERADMIN_ORGANIZATION;

const AUTH_LOGIN = 'auth.login';
const AUTH_PROFILE = 'auth.profile';

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

test('auth.profile returns user data for authenticated SUPER_ADMIN', async () => {
    const token = await getToken(UserRole.SUPER_ADMIN);

    const res = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        token
    );

    expect(res.username).toBe(parsedEnv.SUPERADMIN_USERNAME);
    expect(res.role).toBe(UserRole.SUPER_ADMIN);
    expect(res.organizationName).toBe(parsedEnv.SUPERADMIN_ORGANIZATION);
});

test('auth.profile returns user data for authenticated ADMIN', async () => {
    const token = await getToken(UserRole.ADMIN);

    const res = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        token
    );

    expect(res.username).toBe(parsedEnv.ADMIN_USERNAME);
    expect(res.role).toBe(UserRole.ADMIN);
    expect(res.organizationName).toBe(parsedEnv.ADMIN_ORGANIZATION);
});

test('auth.profile returns user data for authenticated USER', async () => {
    const token = await getToken(UserRole.USER);

    const res = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        token
    );

    expect(res.username).toBe(parsedEnv.USER_USERNAME);
    expect(res.role).toBe(UserRole.USER);
    expect(res.organizationName).toBe(parsedEnv.USER_ORGANIZATION);
});

test('auth.profile returns UNAUTHORIZED for missing token', async () => {
    const res = await req<ErrorResponse>(
        'GET',
        AUTH_PROFILE
    );

    expect(res.code).toBe('UNAUTHORIZED');
    expect(res.message).toBeDefined();
});

test('auth.profile returns UNAUTHORIZED for invalid token', async () => {
    const res = await req<ErrorResponse>(
        'GET',
        AUTH_PROFILE,
        undefined,
        'invalid_token'
    );

    expect(res.code).toBe('UNAUTHORIZED');
    expect(res.message).toBeDefined();
});