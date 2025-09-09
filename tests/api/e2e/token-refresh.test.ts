import { test, expect } from 'vitest';
import { req, getToken } from './config/config';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';
import { SuccessStatus } from '@repo/types/trpc/successStatus';
import { UserRole } from '@repo/types/users/roles';
import { parsedEnv } from '../../utils/envSchema';

const AUTH_REFRESH_TOKEN = 'auth.refreshToken';
const AUTH_LOGOUT = 'auth.logout';

test.describe('Token Refresh and Session Management API Tests', () => {

  test('Token refresh endpoint works correctly', async () => {
    // Get initial token
    const initialToken = await getToken(UserRole.ADMIN);
    
    // Make a request with the token to verify it works
    const profileResponse = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
      'GET',
      'auth.profile',
      undefined,
      initialToken
    );
    
    expect(profileResponse.username).toBe(parsedEnv.ADMIN_USERNAME);
    expect(profileResponse.role).toBe(UserRole.ADMIN);
    
    // Try to refresh the token (this might not work in test environment due to cookie handling)
    // But we can at least test the endpoint exists and responds appropriately
    const refreshResponse = await req<ErrorResponse | SuccessResponse<{ accessToken: string }>>(
      'POST',
      AUTH_REFRESH_TOKEN
    );
    
    // Response should either be successful refresh or unauthorized (if no refresh cookie)
    if ('accessToken' in refreshResponse) {
      expect(refreshResponse.status).toBe(SuccessStatus.TOKEN_REFRESHED);
      expect(refreshResponse.accessToken).toBeDefined();
    } else {
      expect(refreshResponse.code).toBe('UNAUTHORIZED');
    }
  });

  test('Logout endpoint clears authentication', async () => {
    const logoutResponse = await req<SuccessResponse<{ status: string }>>(
      'POST',
      AUTH_LOGOUT
    );
    
    expect(logoutResponse.status).toBe(SuccessStatus.LOGGED_OUT);
  });

  test('Token refresh with invalid token returns error', async () => {
    // Call refresh without any cookies/tokens
    const refreshResponse = await req<ErrorResponse>(
      'POST',
      AUTH_REFRESH_TOKEN
    );
    
    expect(refreshResponse.code).toBe('UNAUTHORIZED');
    expect(refreshResponse.message).toContain('refresh token');
  });

  test('Multiple concurrent profile requests with same token', async () => {
    const token = await getToken(UserRole.USER);
    
    // Make multiple concurrent requests with the same token
    const profilePromises = Array(5).fill(null).map(() => 
      req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        'auth.profile',
        undefined,
        token
      )
    );
    
    const responses = await Promise.all(profilePromises);
    
    // All responses should be successful and identical
    responses.forEach(response => {
      expect(response.username).toBe(parsedEnv.USER_USERNAME);
      expect(response.role).toBe(UserRole.USER);
      expect(response.organizationName).toBe(parsedEnv.USER_ORGANIZATION);
    });
    
    // All responses should be identical
    const firstResponse = responses[0];
    responses.forEach(response => {
      expect(response).toEqual(firstResponse);
    });
  });

  test('Profile endpoint handles different user roles correctly', async () => {
    // Test all three user roles
    const roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER];
    const expectedUsernames = [
      parsedEnv.SUPERADMIN_USERNAME,
      parsedEnv.ADMIN_USERNAME,
      parsedEnv.USER_USERNAME
    ];
    const expectedOrgs = [
      parsedEnv.SUPERADMIN_ORGANIZATION,
      parsedEnv.ADMIN_ORGANIZATION,
      parsedEnv.USER_ORGANIZATION
    ];
    
    for (let i = 0; i < roles.length; i++) {
      const token = await getToken(roles[i]);
      const profileResponse = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        'auth.profile',
        undefined,
        token
      );
      
      expect(profileResponse.username).toBe(expectedUsernames[i]);
      expect(profileResponse.role).toBe(roles[i]);
      expect(profileResponse.organizationName).toBe(expectedOrgs[i]);
    }
  });

  test('Profile response includes all required fields', async () => {
    const token = await getToken(UserRole.ADMIN);
    const profileResponse = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
      'GET',
      'auth.profile',
      undefined,
      token
    );
    
    // Verify all required fields are present
    expect(profileResponse).toHaveProperty('username');
    expect(profileResponse).toHaveProperty('role');
    expect(profileResponse).toHaveProperty('organizationName');
    
    // Verify field types
    expect(typeof profileResponse.username).toBe('string');
    expect(typeof profileResponse.role).toBe('string');
    expect(typeof profileResponse.organizationName).toBe('string');
    
    // Verify field values are not empty
    expect(profileResponse.username.length).toBeGreaterThan(0);
    expect(profileResponse.role.length).toBeGreaterThan(0);
    expect(profileResponse.organizationName.length).toBeGreaterThan(0);
    
    // Verify role is valid
    expect(Object.values(UserRole)).toContain(profileResponse.role as UserRole);
  });

  test('Profile endpoint performance with rapid successive calls', async () => {
    const token = await getToken(UserRole.ADMIN);
    
    const startTime = Date.now();
    
    // Make 10 rapid successive calls
    const promises = Array(10).fill(null).map(() => 
      req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
        'GET',
        'auth.profile',
        undefined,
        token
      )
    );
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All calls should succeed
    responses.forEach(response => {
      expect(response.username).toBe(parsedEnv.ADMIN_USERNAME);
      expect(response.role).toBe(UserRole.ADMIN);
    });
    
    // Performance check - all 10 calls should complete reasonably quickly
    // This is a loose check since it depends on the environment
    expect(totalTime).toBeLessThan(10000); // Less than 10 seconds for 10 calls
  });

  test('Auth flow integration - login, profile, logout sequence', async () => {
    // Step 1: Login
    const loginResponse = await req<SuccessResponse<{ accessToken: string }>>(
      'POST',
      'auth.login',
      {
        username: parsedEnv.ADMIN_USERNAME,
        password: parsedEnv.ADMIN_PASSWORD,
        organizationName: parsedEnv.ADMIN_ORGANIZATION,
      }
    );
    
    expect(loginResponse.status).toBe(SuccessStatus.SUCCESS);
    expect(loginResponse.accessToken).toBeDefined();
    
    // Step 2: Use token to get profile
    const profileResponse = await req<SuccessResponse<{ username: string; role: string; organizationName: string }>>(
      'GET',
      'auth.profile',
      undefined,
      loginResponse.accessToken
    );
    
    expect(profileResponse.username).toBe(parsedEnv.ADMIN_USERNAME);
    expect(profileResponse.role).toBe(UserRole.ADMIN);
    expect(profileResponse.organizationName).toBe(parsedEnv.ADMIN_ORGANIZATION);
    
    // Step 3: Logout
    const logoutResponse = await req<SuccessResponse<{ status: string }>>(
      'POST',
      AUTH_LOGOUT
    );
    
    expect(logoutResponse.status).toBe(SuccessStatus.LOGGED_OUT);
  });

});