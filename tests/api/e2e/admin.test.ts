import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';
import request from 'supertest';
import { setup, env } from '../../setup-global';
import { prisma } from '@repo/db';
import { UserRole } from '@repo/types/users/roles';
import { hashPassword } from '@repo/auth/password';

// Load environment variables
config();

describe('Admin Router', () => {
  let cleanup: () => Promise<void>;
  let adminId: string;
  let adminAccessToken: string;
  let organizationId: string;

  beforeEach(async () => {
    cleanup = await setup();
    
    // Create a test organization
    const org = await prisma.organization.create({
      data: {
        name: env.ADMIN_ORGANIZATION,
      },
    });
    organizationId = org.id;

    // Create an admin user for testing
    const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);
    const admin = await prisma.user.create({
      data: {
        username: env.ADMIN_USERNAME,
        email: env.ADMIN_EMAIL,
        hashedPassword,
        role: UserRole.ADMIN,
        organizationId: org.id,
      },
    });
    adminId = admin.id;

    // Login as admin to get access token
    const loginResponse = await request('http://localhost:3000')
      .post('/trpc/auth.login')
      .send({
        username: env.ADMIN_USERNAME,
        organizationName: env.ADMIN_ORGANIZATION,
        password: env.ADMIN_PASSWORD,
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.result.data.accessToken).toBeDefined();
    adminAccessToken = loginResponse.body.result.data.accessToken;
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('listUsers', () => {
    it('should list users in admin organization', async () => {
      // Create test users
      await prisma.user.createMany({
        data: [
          {
            username: 'testuser1',
            email: 'testuser1@test.com',
            role: UserRole.USER,
            organizationId,
            oneTimeAccessCode: 'TESTCODE123456',
          },
          {
            username: 'testuser2',
            email: 'testuser2@test.com',
            role: UserRole.USER,
            organizationId,
            hashedPassword: await hashPassword('password123'),
          },
        ],
      });

      const response = await request('http://localhost:3000')
        .get('/trpc/admin.listUsers')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.result.data.status).toBe('SUCCESS');
      expect(response.body.result.data.users).toHaveLength(2);
      expect(response.body.result.data.users[0]).toHaveProperty('username');
      expect(response.body.result.data.users[0]).toHaveProperty('email');
      expect(response.body.result.data.users[0]).toHaveProperty('hasInitialPassword');
    });

    it('should not list admins or super admins', async () => {
      // Create users with different roles
      await prisma.user.createMany({
        data: [
          {
            username: 'testuser1',
            role: UserRole.USER,
            organizationId,
          },
          {
            username: 'testadmin1',
            role: UserRole.ADMIN,
            organizationId,
          },
          {
            username: 'testsuperadmin1',
            role: UserRole.SUPER_ADMIN,
            organizationId,
          },
        ],
      });

      const response = await request('http://localhost:3000')
        .get('/trpc/admin.listUsers')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.result.data.users).toHaveLength(1);
      expect(response.body.result.data.users[0].username).toBe('testuser1');
    });

    it('should require admin authorization', async () => {
      const response = await request('http://localhost:3000')
        .get('/trpc/admin.listUsers');

      expect(response.status).toBe(401);
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@test.com',
      };

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.createUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.result.data.status).toBe('USER_CREATED');
      expect(response.body.result.data.username).toBe(userData.username);
      expect(response.body.result.data.email).toBe(userData.email);
      expect(response.body.result.data.oneTimeAccessCode).toBeDefined();

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: {
          organizationId_username: {
            organizationId,
            username: userData.username,
          },
        },
      });

      expect(createdUser).toBeTruthy();
      expect(createdUser?.role).toBe(UserRole.USER);
      expect(createdUser?.organizationId).toBe(organizationId);
    });

    it('should create user without email', async () => {
      const userData = {
        username: 'userwithoutmail',
      };

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.createUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.result.data.status).toBe('USER_CREATED');
      expect(response.body.result.data.email).toBeNull();
    });

    it('should reject duplicate username in same organization', async () => {
      // Create initial user
      await prisma.user.create({
        data: {
          username: 'existinguser',
          role: UserRole.USER,
          organizationId,
        },
      });

      const userData = {
        username: 'existinguser',
        email: 'different@test.com',
      };

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.createUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('Username already exists');
    });

    it('should reject duplicate email in same organization', async () => {
      // Create initial user
      await prisma.user.create({
        data: {
          username: 'existinguser',
          email: 'existing@test.com',
          role: UserRole.USER,
          organizationId,
        },
      });

      const userData = {
        username: 'newuser',
        email: 'existing@test.com',
      };

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.createUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('Email already exists');
    });
  });

  describe('deleteUser', () => {
    let testUserId: string;

    beforeEach(async () => {
      const testUser = await prisma.user.create({
        data: {
          username: 'usertodelete',
          role: UserRole.USER,
          organizationId,
        },
      });
      testUserId = testUser.id;
    });

    it('should delete user successfully', async () => {
      const response = await request('http://localhost:3000')
        .post('/trpc/admin.deleteUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userId: testUserId });

      expect(response.status).toBe(200);
      expect(response.body.result.data.status).toBe('USER_DELETED');
      expect(response.body.result.data.username).toBe('usertodelete');

      // Verify user was deleted from database
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(deletedUser).toBeNull();
    });

    it('should not delete users from other organizations', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: { name: 'OtherOrg' },
      });
      const otherUser = await prisma.user.create({
        data: {
          username: 'otherorguser',
          role: UserRole.USER,
          organizationId: otherOrg.id,
        },
      });

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.deleteUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userId: otherUser.id });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('manage users in your organization');
    });

    it('should not delete admins', async () => {
      const adminUser = await prisma.user.create({
        data: {
          username: 'adminuser',
          role: UserRole.ADMIN,
          organizationId,
        },
      });

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.deleteUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userId: adminUser.id });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('only delete users with USER role');
    });
  });

  describe('resetUser', () => {
    let testUserId: string;

    beforeEach(async () => {
      const testUser = await prisma.user.create({
        data: {
          username: 'usertoreset',
          email: 'reset@test.com',
          role: UserRole.USER,
          organizationId,
          hashedPassword: await hashPassword('oldpassword'),
        },
      });
      testUserId = testUser.id;
    });

    it('should reset user successfully', async () => {
      const response = await request('http://localhost:3000')
        .post('/trpc/admin.resetUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userId: testUserId });

      expect(response.status).toBe(200);
      expect(response.body.result.data.status).toBe('USER_RESET');
      expect(response.body.result.data.username).toBe('usertoreset');
      expect(response.body.result.data.oneTimeAccessCode).toBeDefined();

      // Verify user was reset in database
      const resetUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(resetUser?.hashedPassword).toBeNull();
      expect(resetUser?.oneTimeAccessCode).toBeTruthy();
    });

    it('should not reset users from other organizations', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: { name: 'AnotherOrg' },
      });
      const otherUser = await prisma.user.create({
        data: {
          username: 'otheruser',
          role: UserRole.USER,
          organizationId: otherOrg.id,
        },
      });

      const response = await request('http://localhost:3000')
        .post('/trpc/admin.resetUser')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userId: otherUser.id });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('manage users in your organization');
    });
  });
});