import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { req, getToken } from './config/config';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';
import { Unit } from '@repo/types/units';

describe('Dashboard - Edit Item API', () => {
  let userToken: string;
  let testFolderId: string;
  let testItemId: string;

  beforeEach(async () => {
    // Get user token for authentication
    userToken = await getToken(UserRole.USER);

    // Create a test folder
    const folderName = `test-folder-${faker.string.alphanumeric(8)}`;
    const folderResponse = await req<SuccessResponse<{ folder: { id: string } }>>(
      'POST',
      'dashboard.createFolder',
      { name: folderName },
      userToken
    );
    testFolderId = folderResponse.folder.id;

    // Create a test item
    const itemData = {
      name: `test-item-${faker.string.alphanumeric(8)}`,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      cost: parseFloat(faker.commerce.price()) * 0.7, // cost is typically lower than price
      quantity: parseFloat((Math.random() * 100 + 1).toFixed(2)), // decimal quantity
      unit: Unit.KG,
      folderId: testFolderId
    };

    const itemResponse = await req<SuccessResponse<{ item: { id: string } }>>(
      'POST',
      'dashboard.createItem',
      itemData,
      userToken
    );
    testItemId = itemResponse.item.id;
  });

  describe('updateItem endpoint', () => {
    it('should update item name, description, and price', async () => {
      const updateData = {
        itemId: testItemId,
        name: `updated-item-${faker.string.alphanumeric(8)}`,
        description: 'Updated description',
        price: 99.99
      };

      const response = await req<SuccessResponse<{message: string}>>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Item "${updateData.name}" updated successfully`);
    });

    it('should require valid item name', async () => {
      const updateData = {
        itemId: testItemId,
        name: '', // Empty name should fail
        description: 'Valid description',
        price: 50.00
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should require valid price (non-negative)', async () => {
      const updateData = {
        itemId: testItemId,
        name: 'Valid Name',
        description: 'Valid description',
        price: -10.00 // Negative price should fail
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should update item with cost and unit fields', async () => {
      const updateData = {
        itemId: testItemId,
        name: `updated-item-${faker.string.alphanumeric(8)}`,
        description: 'Updated with cost and unit',
        price: 150.50,
        cost: 89.75,
        unit: Unit.L
      };

      const response = await req<SuccessResponse<{message: string}>>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Item "${updateData.name}" updated successfully`);
    });

    it('should accept optional cost field', async () => {
      const updateData = {
        itemId: testItemId,
        name: `updated-item-${faker.string.alphanumeric(8)}`,
        description: 'No cost provided',
        price: 75.25,
        unit: Unit.PCS // cost field omitted
      };

      const response = await req<SuccessResponse<{message: string}>>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Item "${updateData.name}" updated successfully`);
    });

    it('should require valid cost (non-negative when provided)', async () => {
      const updateData = {
        itemId: testItemId,
        name: 'Valid Name',
        description: 'Valid description',
        price: 50.00,
        cost: -25.00 // Negative cost should fail
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should update item cost to zero correctly', async () => {
      const updateData = {
        itemId: testItemId,
        name: `updated-item-${faker.string.alphanumeric(8)}`,
        description: 'Cost set to zero',
        price: 50.00,
        cost: 0, // This was the bug case - zero cost should be preserved
        unit: Unit.M
      };

      const response = await req<SuccessResponse<{message: string}>>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Item "${updateData.name}" updated successfully`);
    });

    it('should return NOT_FOUND for non-existent item', async () => {
      const updateData = {
        itemId: 'non-existent-id',
        name: 'Valid Name',
        description: 'Valid description',
        price: 50.00
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
      expect(response.message).toContain('Item not found');
    });
  });

  describe('adjustItemQuantity endpoint', () => {
    it('should increase item quantity with positive adjustment', async () => {
      const adjustmentData = {
        itemId: testItemId,
        adjustment: 25
      };

      const response = await req<SuccessResponse<{ message: string; newQuantity: number }>>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`quantity adjusted by +${adjustmentData.adjustment}. New quantity: ${response.newQuantity}`);
      expect(response.newQuantity).toBeGreaterThan(0);
    });

    it('should handle decimal quantity adjustments', async () => {
      const adjustmentData = {
        itemId: testItemId,
        adjustment: 2.5 // Decimal adjustment
      };

      const response = await req<SuccessResponse<{ message: string; newQuantity: number }>>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`quantity adjusted by +${adjustmentData.adjustment}. New quantity: ${response.newQuantity}`);
      expect(response.newQuantity).toBeGreaterThan(0);
    });

    it('should decrease item quantity with negative adjustment', async () => {
      const adjustmentData = {
        itemId: testItemId,
        adjustment: -5
      };

      const response = await req<SuccessResponse<{ message: string; newQuantity: number }>>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`quantity adjusted by ${adjustmentData.adjustment}. New quantity: ${response.newQuantity}`);
      expect(response.newQuantity).toBeGreaterThanOrEqual(0);
    });

    it('should prevent quantity from going below zero', async () => {
      const adjustmentData = {
        itemId: testItemId,
        adjustment: -1000 // Large negative adjustment to test validation
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData,
        userToken
      );

      expect(response.data.code).toBe('INTERNAL_SERVER_ERROR');

    });

    it('should reject zero adjustment', async () => {
      const adjustmentData = {
        itemId: testItemId,
        adjustment: 0 // Zero adjustment should be rejected
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should return NOT_FOUND for non-existent item', async () => {
      const adjustmentData = {
        itemId: 'non-existent-id',
        adjustment: 10
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData,
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
      expect(response.message).toContain('Item not found');
    });
  });

  describe('deleteItem endpoint', () => {
    it('should delete an existing item', async () => {
      const deleteData = {
        itemId: testItemId
      };

      const response = await req<SuccessResponse<{ message: string }>>(
        'POST',
        'dashboard.deleteItem',
        deleteData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain('deleted successfully');
    });

    it('should return NOT_FOUND for non-existent item', async () => {
      const deleteData = {
        itemId: 'non-existent-id'
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.deleteItem',
        deleteData,
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
      expect(response.message).toContain('Item not found');
    });

    it('should prevent deleting items from other organizations', async () => {
      // Get admin token (different organization)
      const adminToken = await getToken(UserRole.SUPER_ADMIN);

      const deleteData = {
        itemId: testItemId
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.deleteItem',
        deleteData,
        adminToken
      );

      expect(response.data.code).toBe('FORBIDDEN');
      expect(response.message).toContain('You can only delete items in your organization');
    });
  });

  describe('Authorization checks', () => {
    it('should require authentication for updateItem', async () => {
      const updateData = {
        itemId: testItemId,
        name: 'Updated Name',
        description: 'Updated description',
        price: 50.00
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateItem',
        updateData
        // No token provided
      );

      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should require authentication for adjustItemQuantity', async () => {
      const adjustmentData = {
        itemId: testItemId,
        adjustment: 10
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.adjustItemQuantity',
        adjustmentData
        // No token provided
      );

      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should require authentication for deleteItem', async () => {
      const deleteData = {
        itemId: testItemId
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.deleteItem',
        deleteData
        // No token provided
      );

      expect(response.data.code).toBe('UNAUTHORIZED');
    });
  });
});