import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { req, getToken } from './config/config';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';

describe('Dashboard - Shelves API', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    userToken = await getToken(UserRole.USER);
    adminToken = await getToken(UserRole.ADMIN);
  });

  describe('createShelf endpoint', () => {
    it('should create a new shelf with color successfully', async () => {
      const shelfData = {
        name: `test-shelf-${faker.string.alphanumeric(8)}`,
        color: '#10b981'
      };

      const response = await req<SuccessResponse<{ message: string; shelf: any }>>( 
        'POST',
        'dashboard.createShelf',
        shelfData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Shelf "${shelfData.name}" created successfully`);
      expect(response.shelf.name).toBe(shelfData.name);
      expect(response.shelf.color).toBe(shelfData.color);
      expect(response.shelf.id).toBeDefined();
      expect(response.shelf.isExpanded).toBe(true);
      expect(response.shelf.items).toEqual([]);
      expect(response.shelf.createdAt).toBeDefined();
      expect(response.shelf.updatedAt).toBeDefined();
      expect(response.shelf.lastModifiedBy).toBeDefined();
    });

    it('should validate color format', async () => {
      const shelfData = {
        name: `test-shelf-${faker.string.alphanumeric(8)}`,
        color: 'invalid-color'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createShelf',
        shelfData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
      expect(response.data.httpStatus).toBe(400);
    });

    it('should accept different valid color formats', async () => {
      const validColors = ['#FF5733', '#abc', '#123456', '#DEF'];
      
      for (const color of validColors) {
        const shelfData = {
          name: `test-shelf-${faker.string.alphanumeric(8)}`,
          color
        };

        const response = await req<SuccessResponse<{ message: string; shelf: any }>>( 
          'POST',
          'dashboard.createShelf',
          shelfData,
          userToken
        );

        expect(response.status).toBe('SUCCESS');
        expect(response.shelf.color).toBe(color);
      }
    });

    it('should reject invalid color formats', async () => {
      const invalidColors = ['red', 'rgb(255,0,0)', '#gggggg', '#12345', '#1234567', ''];
      
      for (const color of invalidColors) {
        const shelfData = {
          name: `test-shelf-${faker.string.alphanumeric(8)}`,
          color
        };

        const response = await req<ErrorResponse>(
          'POST',
          'dashboard.createShelf',
          shelfData,
          userToken
        );

        expect(response.data.code).toBe('BAD_REQUEST');
      }
    });

    it('should require shelf name', async () => {
      const shelfData = {
        name: '',
        color: '#10b981'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createShelf',
        shelfData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should prevent duplicate shelf names', async () => {
      const shelfName = `test-shelf-${faker.string.alphanumeric(8)}`;
      
      // Create first shelf
      const firstShelfData = {
        name: shelfName,
        color: '#10b981'
      };

      const firstResponse = await req<SuccessResponse<{ message: string; shelf: any }>>( 
        'POST',
        'dashboard.createShelf',
        firstShelfData,
        userToken
      );

      expect(firstResponse.status).toBe('SUCCESS');

      // Try to create duplicate
      const duplicateShelfData = {
        name: shelfName,
        color: '#f59e0b'
      };

      const duplicateResponse = await req<ErrorResponse>(
        'POST',
        'dashboard.createShelf',
        duplicateShelfData,
        userToken
      );

      expect(duplicateResponse.data.code).toBe('CONFLICT');
    });
  });

  describe('getShelvesWithItems endpoint', () => {
    it('should return shelves with color information', async () => {
      // First create a shelf with color
      const shelfData = {
        name: `test-shelf-${faker.string.alphanumeric(8)}`,
        color: '#8b5cf6'
      };

      const createResponse = await req<SuccessResponse<{ message: string; shelf: any }>>( 
        'POST',
        'dashboard.createShelf',
        shelfData,
        userToken
      );

      expect(createResponse.status).toBe('SUCCESS');

      // Then get shelves
      const getResponse = await req<SuccessResponse<{ shelves: any[] }>>( 
        'GET',
        'dashboard.getShelvesWithItems',
        {},
        userToken
      );

      expect(getResponse.status).toBe('SUCCESS');
      expect(getResponse.shelves).toBeDefined();
      expect(Array.isArray(getResponse.shelves)).toBe(true);

      // Find our created shelf
      const createdShelf = getResponse.shelves.find(s => s.id === createResponse.shelf.id);
      expect(createdShelf).toBeDefined();
      expect(createdShelf.name).toBe(shelfData.name);
      expect(createdShelf.color).toBe(shelfData.color);
      expect(createdShelf.isExpanded).toBeDefined();
      expect(createdShelf.items).toBeDefined();
    });
  });

  describe('updateShelf endpoint', () => {
    let shelfId: string;

    beforeEach(async () => {
      // Create a test shelf for updating
      const shelfData = {
        name: `test-shelf-${faker.string.alphanumeric(8)}`,
        color: '#10b981'
      };

      const response = await req<SuccessResponse<{ message: string; shelf: any }>>( 
        'POST',
        'dashboard.createShelf',
        shelfData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      shelfId = response.shelf.id;
    });

    it('should update shelf name and color successfully', async () => {
      const updateData = {
        shelfId,
        name: `updated-shelf-${faker.string.alphanumeric(8)}`,
        color: '#f59e0b'
      };

      const response = await req<SuccessResponse<{ message: string }>>( 
        'POST',
        'dashboard.updateShelf',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Shelf "${updateData.name}" updated successfully`);
    });

    it('should validate color format on update', async () => {
      const updateData = {
        shelfId,
        name: `updated-shelf-${faker.string.alphanumeric(8)}`,
        color: 'invalid-color'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateShelf',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should reject updates to non-existent shelf', async () => {
      const updateData = {
        shelfId: 'non-existent-id',
        name: `updated-shelf-${faker.string.alphanumeric(8)}`,
        color: '#10b981'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateShelf',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
    });
  });
});