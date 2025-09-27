import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { req, getToken } from './config/config';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';
import { Unit } from '@repo/types/units';

describe('Dashboard - Create Item API', () => {
  let userToken: string;
  let testShelfId: string;

  beforeEach(async () => {
    // Get user token for authentication
    userToken = await getToken(UserRole.USER);

    // Create a test shelf
    const shelfName = `test-shelf-${faker.string.alphanumeric(8)}`;
    const shelfResponse = await req<SuccessResponse<{ shelf: { id: string } }>>(
      'POST',
      'dashboard.createShelf',
      { name: shelfName },
      userToken
    );
    testShelfId = shelfResponse.shelf.id;
  });

  describe('createItem endpoint', () => {
    it('should create item with all new fields (cost, unit, decimal quantity)', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 150.75,
        cost: 89.25,
        quantity: 12.5, // decimal quantity
        unit: Unit.L,
        shelfId: testShelfId
      };

      const response = await req<SuccessResponse<{ message: string; item: any }>>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Item "${itemData.name}" created successfully`);
      expect(response.item.name).toBe(itemData.name);
      expect(response.item.price).toBe(itemData.price);
      expect(response.item.cost).toBe(itemData.cost);
      expect(response.item.quantity).toBe(itemData.quantity);
      expect(response.item.unit).toBe(itemData.unit);
    });

    it('should create item without optional cost field', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 99.99,
        quantity: 5.25,
        unit: Unit.KG,
        shelfId: testShelfId
        // cost field omitted
      };

      const response = await req<SuccessResponse<{ message: string; item: any }>>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain(`Item "${itemData.name}" created successfully`);
      expect(response.item.cost).toBeNull();
    });

    it('should use default unit PCS when not specified', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 25.50,
        quantity: 10,
        shelfId: testShelfId
        // unit field omitted
      };

      const response = await req<SuccessResponse<{ item: any }>>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.item.unit).toBe(Unit.PCS);
    });

    it('should accept all valid unit types', async () => {
      const validUnits = [Unit.PCS, Unit.KG, Unit.G, Unit.L, Unit.ML, Unit.M, Unit.CM, Unit.M2, Unit.M3];
      
      for (const unit of validUnits) {
        const itemData = {
          name: `test-item-${unit}-${faker.string.alphanumeric(8)}`,
          description: `Item with unit ${unit}`,
          price: parseFloat(faker.commerce.price()),
          quantity: parseFloat((Math.random() * 10 + 1).toFixed(2)),
          unit: unit,
          shelfId: testShelfId
        };

        const response = await req<SuccessResponse<{ item: any }>>(
          'POST',
          'dashboard.createItem',
          itemData,
          userToken
        );

        expect(response.status).toBe('SUCCESS');
        expect(response.item.unit).toBe(unit);
      }
    }, { timeout: 20000 }); // Increase timeout for this test

    it('should reject negative cost', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 50.00,
        cost: -10.00, // Negative cost should fail
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should reject negative quantity', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 50.00,
        quantity: -5.5, // Negative quantity should fail
        unit: Unit.L,
        shelfId: testShelfId
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
    });

    it('should handle very small decimal quantities', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: 'Item with very small quantity',
        price: 1000.00,
        cost: 800.00,
        quantity: 0.01, // Very small decimal
        unit: Unit.ML,
        shelfId: testShelfId
      };

      const response = await req<SuccessResponse<{ item: any }>>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.item.quantity).toBe(0.01);
    });
  });
});