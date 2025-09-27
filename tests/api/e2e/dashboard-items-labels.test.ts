import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { req, getToken } from './config/config';
import { SuccessResponse, ErrorResponse } from '@repo/types/trpc/response';
import { UserRole } from '@repo/types/users/roles';
import { Unit } from '@repo/types/units';

describe('Dashboard - Items with Labels API', () => {
  let userToken: string;
  let testShelfId: string;
  let testLabel1Id: string;
  let testLabel2Id: string;
  let testLabel3Id: string;

  beforeEach(async () => {
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

    // Create test labels
    const label1Response = await req<SuccessResponse<{ label: { id: string } }>>( 
      'POST',
      'dashboard.createLabel',
      { name: `label1-${faker.string.alphanumeric(6)}`, color: '#FF5733' },
      userToken
    );
    testLabel1Id = label1Response.label.id;

    const label2Response = await req<SuccessResponse<{ label: { id: string } }>>( 
      'POST',
      'dashboard.createLabel',
      { name: `label2-${faker.string.alphanumeric(6)}`, color: '#33FF57' },
      userToken
    );
    testLabel2Id = label2Response.label.id;

    const label3Response = await req<SuccessResponse<{ label: { id: string } }>>( 
      'POST',
      'dashboard.createLabel',
      { name: `label3-${faker.string.alphanumeric(6)}`, color: '#3357FF' },
      userToken
    );
    testLabel3Id = label3Response.label.id;
  });

  describe('createItem with labels', () => {
    it('should create item with no labels', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId
      };

      const response = await req<SuccessResponse<{ message: string; item: any }>>( 
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.item.name).toBe(itemData.name);
      expect(response.item.labels).toEqual([]);
    });

    it('should create item with one label', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id]
      };

      const response = await req<SuccessResponse<{ message: string; item: any }>>( 
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.item.name).toBe(itemData.name);
      expect(response.item.labels).toHaveLength(1);
      expect(response.item.labels[0].id).toBe(testLabel1Id);
    });

    it('should create item with two labels', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id, testLabel2Id]
      };

      const response = await req<SuccessResponse<{ message: string; item: any }>>( 
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.item.name).toBe(itemData.name);
      expect(response.item.labels).toHaveLength(2);
      
      const labelIds = response.item.labels.map((l: any) => l.id);
      expect(labelIds).toContain(testLabel1Id);
      expect(labelIds).toContain(testLabel2Id);
    });

    it('should reject item with more than 2 labels', async () => {
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id, testLabel2Id, testLabel3Id]
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.data.code).toBe('BAD_REQUEST');
      expect(response.message).toContain('Items can have at most 2 labels');
    });

    it('should reject item with non-existent label', async () => {
      const fakeId = 'fake-id-that-does-not-exist';
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: faker.commerce.productDescription(),
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [fakeId]
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );

      expect(response.data.code).toBe('NOT_FOUND');
      expect(response.message).toContain('One or more labels not found');
    });

    it('should enforce uniqueness constraint based on name and labels', async () => {
      const itemName = `duplicate-item-${faker.string.alphanumeric(8)}`;
      
      // Create first item with no labels
      const firstItemData = {
        name: itemName,
        description: 'First item',
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId
      };

      const firstResponse = await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        firstItemData,
        userToken
      );

      expect(firstResponse.status).toBe('SUCCESS');

      // Try to create second item with same name and no labels
      const secondItemData = {
        name: itemName,
        description: 'Second item',
        price: 200.50,
        quantity: 10,
        unit: Unit.PCS,
        shelfId: testShelfId
      };

      const secondResponse = await req<ErrorResponse>(
        'POST',
        'dashboard.createItem',
        secondItemData,
        userToken
      );

      expect(secondResponse.data.code).toBe('CONFLICT');
      expect(secondResponse.message).toContain('An item with this name and labels already exists');
    });

    it('should allow items with same name but different labels', async () => {
      const itemName = `same-name-item-${faker.string.alphanumeric(8)}`;
      
      // Create first item with no labels
      const firstItemData = {
        name: itemName,
        description: 'First item',
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId
      };

      const firstResponse = await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        firstItemData,
        userToken
      );

      expect(firstResponse.status).toBe('SUCCESS');

      // Create second item with same name but with a label
      const secondItemData = {
        name: itemName,
        description: 'Second item',
        price: 200.50,
        quantity: 10,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id]
      };

      const secondResponse = await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        secondItemData,
        userToken
      );

      expect(secondResponse.status).toBe('SUCCESS');
      expect(secondResponse.item.name).toBe(itemName);
      expect(secondResponse.item.labels).toHaveLength(1);
      expect(secondResponse.item.labels[0].id).toBe(testLabel1Id);
    });

    it('should allow items with same name but different label combinations', async () => {
      const itemName = `multi-label-item-${faker.string.alphanumeric(8)}`;
      
      // Create item with label1
      const item1Data = {
        name: itemName,
        description: 'Item with label1',
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id]
      };

      const response1 = await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        item1Data,
        userToken
      );

      expect(response1.status).toBe('SUCCESS');

      // Create item with label2
      const item2Data = {
        name: itemName,
        description: 'Item with label2',
        price: 200.50,
        quantity: 10,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel2Id]
      };

      const response2 = await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        item2Data,
        userToken
      );

      expect(response2.status).toBe('SUCCESS');

      // Create item with both labels
      const item3Data = {
        name: itemName,
        description: 'Item with both labels',
        price: 300.50,
        quantity: 15,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id, testLabel2Id]
      };

      const response3 = await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        item3Data,
        userToken
      );

      expect(response3.status).toBe('SUCCESS');
      expect(response3.item.labels).toHaveLength(2);
    });
  }, { timeout: 20000 });

  describe('updateItem with labels', () => {
    let testItemId: string;

    beforeEach(async () => {
      // Create a test item
      const itemData = {
        name: `test-item-${faker.string.alphanumeric(8)}`,
        description: 'Test item for updating',
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId
      };

      const response = await req<SuccessResponse<{ item: { id: string } }>>( 
        'POST',
        'dashboard.createItem',
        itemData,
        userToken
      );
      testItemId = response.item.id;
    });

    it('should update item to add labels', async () => {
      const updateData = {
        itemId: testItemId,
        name: `updated-item-${faker.string.alphanumeric(8)}`,
        description: 'Updated description',
        price: 150.75,
        labelIds: [testLabel1Id]
      };

      const response = await req<SuccessResponse<{ message: string }>>( 
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
      expect(response.message).toContain('updated successfully');
    });

    it('should update item to remove labels', async () => {
      // First, create item with labels
      const itemWithLabelsData = {
        name: `item-with-labels-${faker.string.alphanumeric(8)}`,
        description: 'Item with labels',
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id, testLabel2Id]
      };

      const createResponse = await req<SuccessResponse<{ item: { id: string } }>>( 
        'POST',
        'dashboard.createItem',
        itemWithLabelsData,
        userToken
      );

      const itemId = createResponse.item.id;

      // Now remove all labels
      const updateData = {
        itemId: itemId,
        name: itemWithLabelsData.name,
        description: 'Updated without labels',
        price: 200.75,
        labelIds: []
      };

      const response = await req<SuccessResponse<{ message: string }>>( 
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.status).toBe('SUCCESS');
    });

    it('should enforce uniqueness when updating item labels', async () => {
      const sameName = `same-name-${faker.string.alphanumeric(8)}`;
      
      // Create first item with label1
      const item1Data = {
        name: sameName,
        description: 'First item',
        price: 100.50,
        quantity: 5,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel1Id]
      };

      await req<SuccessResponse<{ item: any }>>( 
        'POST',
        'dashboard.createItem',
        item1Data,
        userToken
      );

      // Create second item with label2
      const item2Data = {
        name: sameName,
        description: 'Second item',
        price: 200.50,
        quantity: 10,
        unit: Unit.PCS,
        shelfId: testShelfId,
        labelIds: [testLabel2Id]
      };

      const item2Response = await req<SuccessResponse<{ item: { id: string } }>>( 
        'POST',
        'dashboard.createItem',
        item2Data,
        userToken
      );

      // Try to update second item to have same name and label1 (should conflict)
      const updateData = {
        itemId: item2Response.item.id,
        name: sameName,
        description: 'Updated to conflict',
        price: 300.50,
        labelIds: [testLabel1Id]
      };

      const response = await req<ErrorResponse>(
        'POST',
        'dashboard.updateItem',
        updateData,
        userToken
      );

      expect(response.data.code).toBe('CONFLICT');
      expect(response.message).toContain('An item with this name and labels already exists');
    });
  });
});