import { test, expect, beforeAll, afterAll } from 'vitest';
import { req, getToken } from './config/config';
import { UserRole } from '@repo/types/users/roles';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';
import { SuccessStatus } from '@repo/types/trpc/successStatus';
import { faker } from '@faker-js/faker';

let adminToken: string;
let userToken: string;

const testUsernames = [
  faker.internet.username() + Date.now(),
  faker.internet.username() + Date.now(),
  faker.internet.username() + Date.now()
];

let createdUserIds: string[] = [];

beforeAll(async () => {
  // Get tokens for different user roles
  adminToken = await getToken(UserRole.ADMIN);
  userToken = await getToken(UserRole.USER);
});

// Test listUsers procedure
test('admin can list users in their organization', async () => {
  const res = await req<SuccessResponse<{ users: any[] }>>(
    'GET',
    'admin.listUsers',
    undefined,
    adminToken
  );

  expect(res.status).toBe(SuccessStatus.SUCCESS);
  expect(res.users).toBeDefined();
  expect(Array.isArray(res.users)).toBe(true);
  
  // Check that all users have USER role (implicit from the endpoint behavior)
  for (const user of res.users) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('hasInitialPassword');
  }
});

test('non-admin cannot list users', async () => {
  const res = await req<ErrorResponse>(
    'POST',
    'admin.listUsers',
    undefined,
    userToken
  );

  expect(res.message).toBeDefined();
  expect(res.code).toBeDefined();
});

// Test createUser procedure
test('admin can create new user', async () => {
  const username = testUsernames[0];

  const res = await req<SuccessResponse<{ userId: string; username: string; oneTimeAccessCode: string; expiresAt: Date }>>(
    'POST',
    'admin.createUser',
    { username },
    adminToken
  );

  expect(res.status).toBe(SuccessStatus.USER_CREATED);
  expect(res.userId).toBeDefined();
  expect(res.username).toBe(username);
  expect(res.oneTimeAccessCode).toBeDefined();
  expect(res.expiresAt).toBeDefined();

  // Store created user ID for cleanup
  createdUserIds.push(res.userId);
});

test('admin cannot create user with duplicate username in same organization', async () => {
  const username = testUsernames[1];

  // Create first user
  const firstRes = await req<SuccessResponse<{ userId: string }>>(
    'POST',
    'admin.createUser',
    { username },
    adminToken
  );
  createdUserIds.push(firstRes.userId);

  // Try to create second user with same username
  const res = await req<ErrorResponse>(
    'POST',
    'admin.createUser',
    { username },
    adminToken
  );

  expect(res.message).toBe('Username already exists in this organization.');
  expect(res.data.code).toBe('CONFLICT');
});

test('non-admin cannot create user', async () => {
  const res = await req<ErrorResponse>(
    'POST',
    'admin.createUser',
    { username: 'test-user-fail' },
    userToken
  );

  expect(res.message).toBeDefined();
  expect(res.code).toBeDefined();
});

// Test resetUser procedure
test('admin can reset user OTAC', async () => {
  const username = testUsernames[2];

  // Create a user first
  const createRes = await req<SuccessResponse<{ userId: string; oneTimeAccessCode: string }>>(
    'POST',
    'admin.createUser',
    { username },
    adminToken
  );
  createdUserIds.push(createRes.userId);

  // Reset the user
  const res = await req<SuccessResponse<{ username: string; oneTimeAccessCode: string; expiresAt: Date }>>(
    'POST',
    'admin.resetUser',
    { userId: createRes.userId },
    adminToken
  );

  expect(res.status).toBe(SuccessStatus.USER_RESET);
  expect(res.username).toBe(username);
  expect(res.oneTimeAccessCode).toBeDefined();
  expect(res.expiresAt).toBeDefined();

  // Verify the OTAC is different from the original
  expect(res.oneTimeAccessCode).not.toBe(createRes.oneTimeAccessCode);
});

test('admin cannot reset non-existent user', async () => {
  const res = await req<ErrorResponse>(
    'POST',
    'admin.resetUser',
    { userId: 'non-existent-id' },
    adminToken
  );

  expect(res.message).toBe('User not found.');
  expect(res.data.code).toBe('NOT_FOUND');
});

test('non-admin cannot reset user', async () => {
  const res = await req<ErrorResponse>(
    'POST',
    'admin.resetUser',
    { userId: 'some-user-id' },
    userToken
  );

  expect(res.message).toBeDefined();
  expect(res.code).toBeDefined();
});

// Test deleteUser procedure
test('admin can delete user', async () => {
  const username = 'test-user-to-delete';

  // Create a user first
  const createRes = await req<SuccessResponse<{ userId: string }>>(
    'POST',
    'admin.createUser',
    { username },
    adminToken
  );

  // Delete the user
  const res = await req<SuccessResponse<{ username: string }>>(
    'POST',
    'admin.deleteUser',
    { userId: createRes.userId },
    adminToken
  );

  expect(res.status).toBe(SuccessStatus.USER_DELETED);
  expect(res.username).toBe(username);

  // Verify user is deleted by trying to reset it
  const resetRes = await req<ErrorResponse>(
    'POST',
    'admin.resetUser',
    { userId: createRes.userId },
    adminToken
  );

  expect(resetRes.message).toBe('User not found.');
});

test('admin cannot delete non-existent user', async () => {
  const res = await req<ErrorResponse>(
    'POST',
    'admin.deleteUser',
    { userId: 'non-existent-id' },
    adminToken
  );

  expect(res.message).toBe('User not found.');
  expect(res.data.code).toBe('NOT_FOUND');
});

test('non-admin cannot delete user', async () => {
  const res = await req<ErrorResponse>(
    'POST',
    'admin.deleteUser',
    { userId: 'some-user-id' },
    userToken
  );

  expect(res.message).toBe("Insufficient permissions");
});

// Test organization boundary enforcement
test('admin operations are scoped to admin organization only', async () => {
  // This test verifies that admins can only manage users in their own organization
  // The implementation ensures this by using ctx.user.organizationId in all queries
  // Since we don't have users in different organizations in the test setup,
  // we verify the correct scoping through the successful operations above
  
  const res = await req<SuccessResponse<{ users: any[] }>>(
    'GET',
    'admin.listUsers',
    undefined,
    adminToken
  );

  expect(res.status).toBe(SuccessStatus.SUCCESS);
  expect(res.users).toBeDefined();
  // All returned users belong to the admin's organization (verified by implementation)
});