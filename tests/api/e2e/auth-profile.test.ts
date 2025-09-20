import { test, expect } from 'vitest';
import { req, getToken } from './config/config';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';
import { parsedEnv } from '../../utils/envSchema';

const AUTH_PROFILE = 'auth.profile';
const AUTH_REFRESH_TOKEN = 'auth.refreshToken';
const AUTH_LOGOUT = 'auth.logout';

test('auth.profile endpoint with valid token from different user roles', async () => {
    // Test SUPER_ADMIN profile
    const superAdminToken = await getToken(UserRole.SUPER_ADMIN);
    const superAdminProfile = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        superAdminToken
    );

    expect(superAdminProfile.username).toBe(parsedEnv.SUPERADMIN_USERNAME);
    expect(superAdminProfile.role).toBe(UserRole.SUPER_ADMIN);
    expect(superAdminProfile.organizationName).toBe(parsedEnv.SUPERADMIN_ORGANIZATION);

    // Test ADMIN profile
    const adminToken = await getToken(UserRole.ADMIN);
    const adminProfile = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        adminToken
    );

    expect(adminProfile.username).toBe(parsedEnv.ADMIN_USERNAME);
    expect(adminProfile.role).toBe(UserRole.ADMIN);
    expect(adminProfile.organizationName).toBe(parsedEnv.ADMIN_ORGANIZATION);

    // Test USER profile
    const userToken = await getToken(UserRole.USER);
    const userProfile = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        userToken
    );

    expect(userProfile.username).toBe(parsedEnv.USER_USERNAME);
    expect(userProfile.role).toBe(UserRole.USER);
    expect(userProfile.organizationName).toBe(parsedEnv.USER_ORGANIZATION);
});

test('auth.profile returns consistent data across multiple calls', async () => {
    const token = await getToken(UserRole.ADMIN);

    // Call profile endpoint multiple times
    const firstCall = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        token
    );

    const secondCall = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        token
    );

    const thirdCall = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        token
    );

    // All calls should return identical data
    expect(firstCall).toEqual(secondCall);
    expect(secondCall).toEqual(thirdCall);
    expect(firstCall.username).toBe(parsedEnv.ADMIN_USERNAME);
    expect(firstCall.role).toBe(UserRole.ADMIN);
    expect(firstCall.organizationName).toBe(parsedEnv.ADMIN_ORGANIZATION);
});

test('auth.profile error handling for various invalid scenarios', async () => {
    // Test with no token
    const noTokenResponse = await req<ErrorResponse>(
        'GET',
        AUTH_PROFILE
    );
    expect(noTokenResponse.data.code).toBe('UNAUTHORIZED');

    // Test with completely invalid token format
    const invalidTokenResponse = await req<ErrorResponse>(
        'GET',
        AUTH_PROFILE,
        undefined,
        'completely_invalid_token'
    );
    expect(invalidTokenResponse.data.code).toBe('UNAUTHORIZED');

    // Test with empty token
    const emptyTokenResponse = await req<ErrorResponse>(
        'GET',
        AUTH_PROFILE,
        undefined,
        ''
    );
    expect(emptyTokenResponse.data.code).toBe('UNAUTHORIZED');

    // Test with malformed JWT-like token
    const malformedTokenResponse = await req<ErrorResponse>(
        'GET',
        AUTH_PROFILE,
        undefined,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
    );
    expect(malformedTokenResponse.data.code).toBe('UNAUTHORIZED');
});

test('auth.profile returns proper organization name in response', async () => {
    // This test specifically validates that the profile endpoint 
    // includes organization name which was a key enhancement in this PR
    const adminToken = await getToken(UserRole.ADMIN);
    
    const profile = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        AUTH_PROFILE,
        undefined,
        adminToken
    );

    // Verify all expected fields are present
    expect(profile).toHaveProperty('username');
    expect(profile).toHaveProperty('role'); 
    expect(profile).toHaveProperty('organizationName');

    // Verify organization name is correctly returned
    expect(profile.organizationName).toBe(parsedEnv.ADMIN_ORGANIZATION);
    expect(typeof profile.organizationName).toBe('string');
    expect(profile.organizationName.length).toBeGreaterThan(0);
});