import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { req, getToken } from './config/config';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';

describe('Dashboard - Labels API', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    userToken = await getToken(UserRole.USER);
    adminToken = await getToken(UserRole.ADMIN);
  });

  describe('createLabel endpoint', () => {
    it('should create a new label successfully', async () => {
      const labelData = {
        name: `test-label-${faker.string.alphanumeric(8)}`,
        color: '#FF5733'
      };

      const response = await req<SuccessResponse<{ message: string; label: any }>>( 
        'POST',
        'dashboard.createLabel',
        labelData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Label "${labelData.name}" created successfully`);
      expect(response.label.name).toBe(labelData.name);
      expect(response.label.color).toBe(labelData.color);
      expect(response.label.id).toBeDefined();
      expect(response.label.createdAt).toBeDefined();
      expect(response.label.updatedAt).toBeDefined();
    });

    it('should validate color format', async () => {
      const labelData = {
        name: `test-label-${faker.string.alphanumeric(8)}`,
        color: 'invalid-color'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createLabel',
        labelData,
        userToken
      );

      expect(response.error.data.code).toBe('BAD_REQUEST');
      expect(response.error.message).toContain('Invalid color format');
    });

    it('should prevent duplicate label names within organization', async () => {
      const labelName = `duplicate-label-${faker.string.alphanumeric(8)}`;
      
      // Create first label
      await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: labelName, color: '#FF5733' },
        userToken
      );

      // Try to create second label with same name
      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createLabel',
        { name: labelName, color: '#33FF57' },
        userToken
      );

      expect(response.error.data.code).toBe('CONFLICT');
      expect(response.error.message).toContain('Label with this name already exists');
    });

    it('should allow same label name in different organizations', async () => {
      const labelName = `cross-org-label-${faker.string.alphanumeric(8)}`;
      
      // Create label in first organization (user)
      const response1 = await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: labelName, color: '#FF5733' },
        userToken
      );

      // Create label with same name in second organization (admin)
      const response2 = await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: labelName, color: '#33FF57' },
        adminToken
      );

      expect(response1.status).toBe('SUCCESS');
      expect(response2.status).toBe('SUCCESS');
      expect(response1.label.name).toBe(labelName);
      expect(response2.label.name).toBe(labelName);
    });

    it('should require authentication', async () => {
      const labelData = {
        name: `test-label-${faker.string.alphanumeric(8)}`,
        color: '#FF5733'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createLabel',
        labelData,
        '' // empty token
      );

      expect(response.error.data.code).toBe('UNAUTHORIZED');
    });

    it('should validate label name length', async () => {
      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createLabel',
        { name: '', color: '#FF5733' },
        userToken
      );

      expect(response.error.data.code).toBe('BAD_REQUEST');
      expect(response.error.message).toContain('Label name is required');
    });

    it('should validate maximum label name length', async () => {
      const longName = 'a'.repeat(60); // Exceeds 50 char limit
      
      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createLabel',
        { name: longName, color: '#FF5733' },
        userToken
      );

      expect(response.error.data.code).toBe('BAD_REQUEST');
      expect(response.error.message).toContain('Label name too long');
    });
  });

  describe('getLabels endpoint', () => {
    it('should return empty array when no labels exist', async () => {
      const response = await req<SuccessResponse<{ labels: any[] }>>( 
        'GET',
        'dashboard.getLabels',
        {},
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(Array.isArray(response.labels)).toBe(true);
    });

    it('should return labels sorted by name', async () => {
      // Create multiple labels
      const labelA = await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: `z-label-${faker.string.alphanumeric(6)}`, color: '#FF5733' },
        userToken
      );

      const labelB = await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: `a-label-${faker.string.alphanumeric(6)}`, color: '#33FF57' },
        userToken
      );

      const response = await req<SuccessResponse<{ labels: any[] }>>( 
        'GET',
        'dashboard.getLabels',
        {},
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.labels.length).toBeGreaterThanOrEqual(2);
      
      // Find our labels in the response
      const foundLabelA = response.labels.find(l => l.id === labelA.label.id);
      const foundLabelB = response.labels.find(l => l.id === labelB.label.id);
      
      expect(foundLabelA).toBeDefined();
      expect(foundLabelB).toBeDefined();
      
      // Check that B comes before A in the sorted list
      const indexA = response.labels.findIndex(l => l.id === labelA.label.id);
      const indexB = response.labels.findIndex(l => l.id === labelB.label.id);
      expect(indexB).toBeLessThan(indexA);
    });

    it('should only return labels from user organization', async () => {
      const userLabel = await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: `user-label-${faker.string.alphanumeric(8)}`, color: '#FF5733' },
        userToken
      );

      const adminLabel = await req<SuccessResponse<{ label: any }>>( 
        'POST',
        'dashboard.createLabel',
        { name: `admin-label-${faker.string.alphanumeric(8)}`, color: '#33FF57' },
        adminToken
      );

      const userResponse = await req<SuccessResponse<{ labels: any[] }>>( 
        'GET',
        'dashboard.getLabels',
        {},
        userToken
      );

      const adminResponse = await req<SuccessResponse<{ labels: any[] }>>( 
        'GET',
        'dashboard.getLabels',
        {},
        adminToken
      );

      // User should only see their label
      const userLabels = userResponse.labels.map(l => l.id);
      expect(userLabels).toContain(userLabel.label.id);
      expect(userLabels).not.toContain(adminLabel.label.id);

      // Admin should only see their label
      const adminLabels = adminResponse.labels.map(l => l.id);
      expect(adminLabels).toContain(adminLabel.label.id);
      expect(adminLabels).not.toContain(userLabel.label.id);
    });

    it('should require authentication', async () => {
      const response = await req<ErrorResponse>(
        'GET',
        'dashboard.getLabels',
        {},
        '' // empty token
      );

      expect(response.error.data.code).toBe('UNAUTHORIZED');
    });
  });
});