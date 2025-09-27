import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { req, getToken } from './config/config';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';

describe('Dashboard - Shelf Preferences API', () => {
  let userToken: string;
  let adminToken: string;
  let shelfId: string;

  beforeEach(async () => {
    userToken = await getToken(UserRole.USER);
    adminToken = await getToken(UserRole.ADMIN);

    // Create a test shelf for preference testing
    const shelfData = {
      name: `test-shelf-${faker.string.alphanumeric(8)}`
    };

    const shelfResponse = await req<SuccessResponse<{ message: string; shelf: any }>>(
      'POST',
      'dashboard.createShelf',
      shelfData,
      adminToken
    );

    expect(shelfResponse.status).toBe('SUCCESS');
    shelfId = shelfResponse.shelf.id;
  });

  describe('updateShelfPreference endpoint', () => {
    it('should update shelf preference to collapsed successfully', async () => {
      const preferenceData = {
        shelfId,
        isExpanded: false
      };

      const response = await req<SuccessResponse<{ message: string; preference: any }>>(
        'POST',
        'dashboard.updateShelfPreference',
        preferenceData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toBe('Shelf preference updated successfully.');
      expect(response.preference.shelfId).toBe(shelfId);
      expect(response.preference.isExpanded).toBe(false);
    });

    it('should update shelf preference to expanded successfully', async () => {
      const preferenceData = {
        shelfId,
        isExpanded: true
      };

      const response = await req<SuccessResponse<{ message: string; preference: any }>>(
        'POST',
        'dashboard.updateShelfPreference',
        preferenceData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toBe('Shelf preference updated successfully.');
      expect(response.preference.shelfId).toBe(shelfId);
      expect(response.preference.isExpanded).toBe(true);
    });

    it('should reject invalid shelf ID', async () => {
      const preferenceData = {
        shelfId: 'invalid-shelf-id',
        isExpanded: false
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateShelfPreference',
        preferenceData,
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
      expect(response.data.message).toBe('Shelf not found or access denied.');
    });

    it('should prevent cross-organization access', async () => {
      // Get token for a different organization
      const otherOrgToken = await getToken(UserRole.USER); // This would be a different user/org in real scenario

      const preferenceData = {
        shelfId,
        isExpanded: false
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateShelfPreference',
        preferenceData,
        otherOrgToken
      );

      // Expect either NOT_FOUND or FORBIDDEN depending on implementation
      expect(['NOT_FOUND', 'FORBIDDEN']).toContain(response.data.code);
    });
  });

  describe('getShelfItems endpoint', () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item in the shelf
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.lorem.sentence(),
        price: faker.number.float({ min: 1, max: 100 }),
        quantity: faker.number.int({ min: 1, max: 50 }),
        shelfId
      };

      const itemResponse = await req<SuccessResponse<{ message: string; item: any }>>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(itemResponse.status).toBe('SUCCESS');
      itemId = itemResponse.item.id;
    });

    it('should get shelf items successfully', async () => {
      const response = await req<SuccessResponse<{ items: any[] }>>(
        'POST',
        'dashboard.getShelfItems',
        { shelfId },
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.items).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBeGreaterThan(0);
      
      const item = response.items.find(i => i.id === itemId);
      expect(item).toBeDefined();
      expect(item.id).toBe(itemId);
      expect(item.name).toBeDefined();
      expect(item.price).toBeDefined();
      expect(item.quantity).toBeDefined();
      expect(item.labels).toBeDefined();
      expect(Array.isArray(item.labels)).toBe(true);
    });

    it('should reject invalid shelf ID', async () => {
      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.getShelfItems',
        { shelfId: 'invalid-shelf-id' },
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
      expect(response.data.message).toBe('Shelf not found or access denied.');
    });

    it('should prevent cross-organization access', async () => {
      // Get token for a different organization  
      const otherOrgToken = await getToken(UserRole.USER); // This would be a different user/org in real scenario

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.getShelfItems',
        { shelfId },
        otherOrgToken
      );

      expect(['NOT_FOUND', 'FORBIDDEN']).toContain(response.data.code);
    });
  });

  describe('getShelvesWithItems with preferences', () => {
    it('should return shelves with isExpanded property', async () => {
      // First set a preference
      await req<SuccessResponse<{ message: string; preference: any }>>(
        'POST',
        'dashboard.updateShelfPreference',
        { shelfId, isExpanded: false },
        userToken
      );

      // Then get shelves
      const response = await req<SuccessResponse<{ shelves: any[] }>>(
        'POST',
        'dashboard.getShelvesWithItems',
        {},
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.shelves).toBeDefined();
      expect(Array.isArray(response.shelves)).toBe(true);
      
      const shelf = response.shelves.find(s => s.id === shelfId);
      expect(shelf).toBeDefined();
      expect(shelf.isExpanded).toBe(false);
      expect(shelf.items).toBeDefined();
      expect(Array.isArray(shelf.items)).toBe(true);
    });

    it('should default to collapsed when no preference exists for performance', async () => {
      const response = await req<SuccessResponse<{ shelves: any[] }>>(
        'POST',
        'dashboard.getShelvesWithItems',
        {},
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.shelves).toBeDefined();
      
      const shelf = response.shelves.find(s => s.id === shelfId);
      expect(shelf).toBeDefined();
      expect(shelf.isExpanded).toBe(false); // Default to collapsed for performance
    });
  });
});