import { test, expect, beforeAll } from 'vitest';
import { getToken, req } from './config/config';
import { CreateAdminInput, LoginInput, SetPasswordWithCodeInput } from '@repo/types/schemas/auth';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';
import { SuccessStatus } from '@repo/types/trpc';
import { faker } from '@faker-js/faker';
import { parsedEnv } from 'tests/utils/envSchema';

const SUPER_ADMIN_CREATE_ADMIN = 'superAdmin.createAdmin';
const username = faker.internet.username().toLowerCase();
const password = "Test_admin_password123@";
const organizationName = parsedEnv.SUPERADMIN_ORGANIZATION;
const email = faker.internet.email().toLowerCase();

let token: string;

beforeAll(async () => {
    token = await getToken(UserRole.SUPER_ADMIN);
});

test('create admin', async () => {
    // CREATE ADMIN
    const createAdminInput: CreateAdminInput = {
        username,
        email,
        organizationName,
    };

    const createAdminRes = await req<SuccessResponse<{
        userId: string;
        username: string;
        email: string;
        organizationName: string;
        oneTimeAccessCode: string;
        expiresAt: Date;
    }>>(
        'POST',
        SUPER_ADMIN_CREATE_ADMIN,
        createAdminInput,
        token
    );

    expect(createAdminRes.username).toBe(createAdminInput.username);
    expect(createAdminRes.email).toBe(createAdminInput.email);
    expect(createAdminRes.organizationName).toBe(createAdminInput.organizationName);
    expect(createAdminRes.oneTimeAccessCode).toBeDefined();
    expect(createAdminRes.userId).toBeDefined();
    expect(createAdminRes.expiresAt).toBeDefined();
    expect(createAdminRes.status).toBe(SuccessStatus.ADMIN_CREATED);

    const expiresAtDate = new Date(createAdminRes.expiresAt);
    const now = Date.now();
    const twentyThreeHoursInMs = 23 * 60 * 60 * 1000;
    expect(expiresAtDate.getTime()).toBeGreaterThan(now + twentyThreeHoursInMs);

    // LOGIN AND CHECK VALIDITY OF ACCESS CODE
    const loginInput: LoginInput = {
        username: createAdminInput.username,
        password: createAdminRes.oneTimeAccessCode,
        organizationName: createAdminInput.organizationName,
    };

    const loginRes = await req<SuccessResponse>(
        'POST',
        'auth.login',
        loginInput
    );

    expect(loginRes.status).toBe(SuccessStatus.VALID_ACCESS_CODE);

    // LOGIN WITH WRONG CODE
    const loginWrongCodeInput: LoginInput = {
        username,
        password: 'hdjsnjc23445',
        organizationName,
    };

    const loginErrorRes = await req<ErrorResponse>(
        'POST',
        'auth.login',
        loginWrongCodeInput
    );

    expect(loginErrorRes.message).toBe('Invalid or expired access code.');

    // SET PASSWORD WITH WRONG CODE FORMAT
    const setPasswordWrongCodeInput: SetPasswordWithCodeInput = {
        userId: createAdminRes.userId,
        newPassword: password,
        oneTimeAccessCode: 'QWERT12345',
    };

    const setPasswordWrongCodeRes = await req<ErrorResponse>(
        'POST',
        'auth.setPasswordWithCode',
        setPasswordWrongCodeInput
    );
    expect(setPasswordWrongCodeRes.message).toBe('One-time access code must be at least 12 characters, Access code must have at least 6 letters and 6 numbers');

    // SET PASSWORD WITH WRONG CODE
    const setPasswordWrongCodeInput2: SetPasswordWithCodeInput = {
        userId: createAdminRes.userId,
        newPassword: password,
        oneTimeAccessCode: 'QWERTY123456',
    };

    const setPasswordWrongCodeRes2 = await req<ErrorResponse>(
        'POST',
        'auth.setPasswordWithCode',
        setPasswordWrongCodeInput2
    );
    expect(setPasswordWrongCodeRes2.message).toBe('Invalid or expired access code.');

    // SET INVALID PASSWORD
    const invalidPassInput: SetPasswordWithCodeInput = {
        userId: createAdminRes.userId,
        newPassword: "passwor",
        oneTimeAccessCode: createAdminRes.oneTimeAccessCode,
    };

    const invalidPassRes = await req<ErrorResponse>(
        'POST',
        'auth.setPasswordWithCode',
        invalidPassInput
    );
    expect(invalidPassRes.message).toMatch(/at least 8 characters/i);
    expect(invalidPassRes.message).toMatch(/at least one uppercase letter/i);
    expect(invalidPassRes.message).toMatch(/at least one number/i);
    expect(invalidPassRes.message).toMatch(/at least one special character/i);

    // SET PASSWORD WITH VALID CODE
    const setPasswordInput: SetPasswordWithCodeInput = {
        userId: createAdminRes.userId,
        newPassword: password,
        oneTimeAccessCode: createAdminRes.oneTimeAccessCode,
    };

    const setPasswordRes = await req<SuccessResponse<{ accessToken: string }>>(
        'POST',
        'auth.setPasswordWithCode',
        setPasswordInput
    );
   
    expect(setPasswordRes.status).toBe(SuccessStatus.PASSWORD_SET);
});

test('create admin with invalid organization format', async () => {
    const createAdminInput: CreateAdminInput = {
        username,
        email,
        organizationName: 'no',
    };

    const res = await req<ErrorResponse>(
        'POST',
        SUPER_ADMIN_CREATE_ADMIN,
        createAdminInput,
        token
    );

    expect(res.message).toContain('Organization name must be at least 3 characters');
});

test('create admin with duplicate username', async () => {
    const createAdminInput: CreateAdminInput = {
        username,
        email: 'different@example.com',
        organizationName,
    };

    const res = await req<ErrorResponse>(
        'POST',
        SUPER_ADMIN_CREATE_ADMIN,
        createAdminInput,
        token
    );

    expect(res.message).toBe('Username already exists in this organization.');
});

test('create admin with duplicate email', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'differentusername',
        email,
        organizationName,
    };

    const res = await req<ErrorResponse>(
        'POST',
        SUPER_ADMIN_CREATE_ADMIN,
        createAdminInput,
        token
    );

    expect(res.message).toBe('Email already exists in this organization.');
});

test('create admin with invalid email format', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'boro',
        email: 'invalid-email',
        organizationName,
    };

    const res = await req<ErrorResponse>(
        'POST',
        SUPER_ADMIN_CREATE_ADMIN,
        createAdminInput,
        token
    );

    expect(res.message).toBe('Invalid email address');
});


test('create admin with invalid username format', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'bo',
        email,
        organizationName,
    };

    const res = await req<ErrorResponse>(
        'POST',
        SUPER_ADMIN_CREATE_ADMIN,
        createAdminInput,
        token
    );

    expect(res.message).toBe('Username must be at least 3 characters');
});