import { test, expect } from 'vitest';
import { req } from './config/config';
import { CreateAdminInput } from '@repo/types/schemas/auth';
import { SuccessResponse } from '@repo/types/trpc/response';
import { TRPCError } from '@trpc/server';

const baseUrl = 'http://localhost:3000';

// Mock auth headers - in a real test we'd get this from login
const mockSuperAdminToken = 'your-super-admin-jwt-token';

test('create admin with valid SUPER_ADMIN credentials', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'testadmin',
        email: 'testadmin@example.com',
        organizationName: 'testorg',
    };

    const res = await req<SuccessResponse<'ADMIN_CREATED', {
        userId: string;
        username: string;
        email: string;
        organizationName: string;
        oneTimeAccessCode: string;
        expiresAt: Date;
    }>>(
        'POST',
        `${baseUrl}/trpc/admin.createAdmin`,
        createAdminInput
    );

    expect(res.data.username).toBe(createAdminInput.username);
    expect(res.data.email).toBe(createAdminInput.email);
    expect(res.data.organizationName).toBe(createAdminInput.organizationName);
    expect(res.data.oneTimeAccessCode).toBeDefined();
    expect(res.data.userId).toBeDefined();
    expect(res.data.expiresAt).toBeDefined();
});

test('create admin with invalid organization', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'testadmin2',
        email: 'testadmin2@example.com',
        organizationName: 'nonexistentorg',
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/admin.createAdmin`,
        createAdminInput
    );

    expect(res.message).toEqual('Organization not found.');
});

test('create admin with duplicate username', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'testadmin', // Same as first test
        email: 'different@example.com',
        organizationName: 'testorg',
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/admin.createAdmin`,
        createAdminInput
    );

    expect(res.message).toEqual('Username already exists in this organization.');
});

test('create admin with duplicate email', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'differentusername',
        email: 'testadmin@example.com', // Same as first test
        organizationName: 'testorg',
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/admin.createAdmin`,
        createAdminInput
    );

    expect(res.message).toEqual('Email already exists in this organization.');
});

test('create admin with invalid email format', async () => {
    const createAdminInput: CreateAdminInput = {
        username: 'testadmin3',
        email: 'invalid-email',
        organizationName: 'testorg',
    };

    const res = await req<TRPCError>(
        'POST',
        `${baseUrl}/trpc/admin.createAdmin`,
        createAdminInput
    );

    // This should fail validation before reaching the mutation
    expect(res.code).toBe('BAD_REQUEST');
});