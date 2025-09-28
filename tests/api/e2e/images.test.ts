import { describe, it, expect, beforeAll } from 'vitest';
import { req, getToken } from './config/config';
import { UserRole } from '@repo/types/users/roles';
import { SuccessStatus } from '@repo/types/trpc';
import { faker } from '@faker-js/faker';

describe('Images API Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testShelfId: string;
  let testItemId: string;

  beforeAll(async () => {
    // Get tokens for different user roles
    adminToken = await getToken(UserRole.ADMIN);
    userToken = await getToken(UserRole.USER);

    // Create a test shelf for item creation
    const shelfResponse = await req(
      'POST',
      'dashboard.createShelf',
      {
        name: `Test Shelf for Images ${faker.string.uuid()}`
      },
      adminToken
    );

    if (shelfResponse.status === SuccessStatus.SUCCESS) {
      testShelfId = shelfResponse.shelf.id;
    }
  });

  describe('Generate Upload Signature', () => {
    it('should successfully generate upload signature for authenticated user', async () => {
      const response = await req(
        'POST',
        'images.generateUploadSignature',
        {},
        userToken
      );

      expect(response.status).toBe(SuccessStatus.SUCCESS);
      expect(response.signature).toBeDefined();
      expect(response.signature.signature).toBeDefined();
      expect(response.signature.timestamp).toBeDefined();
      expect(response.signature.api_key).toBeDefined();
      expect(response.signature.cloud_name).toBeDefined();
      expect(response.signature.folder).toBeDefined();
      expect(response.signature.folder).toMatch(/^invertar\/[^\/]+\/items$/);
    });

    it('should fail to generate upload signature without authentication', async () => {
      const response = await req(
        'POST',
        'images.generateUploadSignature',
        {}
      );

      expect(response.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Get Item Images', () => {
    beforeAll(async () => {
      // Create a test item with a mock cloudinary public ID
      const itemResponse = await req(
        'POST',
        'dashboard.createItem',
        {
          name: `Test Item with Image ${faker.string.uuid()}`,
          description: 'Test item for image testing',
          price: 10.99,
          shelfId: testShelfId,
          cloudinaryPublicId: 'invertar/test-org/items/test-image-123'
        },
        userToken
      );

      if (itemResponse.status === SuccessStatus.SUCCESS) {
        testItemId = itemResponse.item.id;
      }
    });

    it('should successfully get image URLs for items with images', async () => {
      const response = await req(
        'GET',
        'images.getItemImages',
        {
          itemIds: [testItemId]
        },
        userToken
      );

      expect(response.status).toBe(SuccessStatus.SUCCESS);
      expect(response.imageUrls).toBeDefined();
      expect(response.imageUrls[testItemId]).toBeDefined();
      expect(response.imageUrls[testItemId].thumbnail).toBeDefined();
      expect(response.imageUrls[testItemId].medium).toBeDefined();
      expect(response.imageUrls[testItemId].publicId).toBeDefined();
    });

    it('should handle items without images gracefully', async () => {
      // Create an item without an image
      const itemResponse = await req(
        'POST',
        'dashboard.createItem',
        {
          name: `Test Item No Image ${faker.string.uuid()}`,
          description: 'Test item without image',
          price: 5.99,
          shelfId: testShelfId
        },
        userToken
      );

      const itemId = itemResponse.item.id;

      const response = await req(
        'GET',
        'images.getItemImages',
        {
          itemIds: [itemId]
        },
        userToken
      );

      expect(response.status).toBe(SuccessStatus.SUCCESS);
      expect(response.imageUrls).toBeDefined();
      expect(response.imageUrls[itemId]).toBeUndefined();
    });

    it('should fail to get images without authentication', async () => {
      const response = await req(
        'GET',
        'images.getItemImages',
        {
          itemIds: [testItemId]
        }
      );

      expect(response.code).toBe('UNAUTHORIZED');
    });

    it('should fail to get images for non-existent items', async () => {
      const response = await req(
        'GET',
        'images.getItemImages',
        {
          itemIds: ['non-existent-item-id']
        },
        userToken
      );

      expect(response.code).toBe('NOT_FOUND');
    });

    it('should require at least one item ID', async () => {
      const response = await req(
        'GET',
        'images.getItemImages',
        {
          itemIds: []
        },
        userToken
      );

      expect(response.code).toBe('BAD_REQUEST');
    });
  });

  describe('Delete Image', () => {
    it('should fail to delete image with invalid public ID format', async () => {
      const response = await req(
        'POST',
        'images.deleteImage',
        {
          publicId: 'invalid-public-id-not-for-organization'
        },
        userToken
      );

      expect(response.code).toBe('FORBIDDEN');
    });

    it('should fail to delete image without authentication', async () => {
      const response = await req(
        'POST',
        'images.deleteImage',
        {
          publicId: 'invertar/test-org/items/some-image'
        }
      );

      expect(response.code).toBe('UNAUTHORIZED');
    });

    it('should require public ID parameter', async () => {
      const response = await req(
        'POST',
        'images.deleteImage',
        {
          publicId: ''
        },
        userToken
      );

      expect(response.code).toBe('BAD_REQUEST');
    });
  });

  describe('Item Creation with Images', () => {
    it('should successfully create item with valid cloudinary public ID', async () => {
      const mockPublicId = 'invertar/test-org/items/valid-image-123';
      
      const response = await req(
        'POST',
        'dashboard.createItem',
        {
          name: `Item with Valid Image ${faker.string.uuid()}`,
          description: 'Test item with valid cloudinary ID',
          price: 15.99,
          shelfId: testShelfId,
          cloudinaryPublicId: mockPublicId
        },
        userToken
      );

      expect(response.status).toBe(SuccessStatus.SUCCESS);
      expect(response.item.cloudinaryPublicId).toBe(mockPublicId);
    });

    it('should reject item creation with invalid cloudinary public ID', async () => {
      const response = await req(
        'POST',
        'dashboard.createItem',
        {
          name: `Item with Invalid Image ${faker.string.uuid()}`,
          description: 'Test item with invalid cloudinary ID',
          price: 15.99,
          shelfId: testShelfId,
          cloudinaryPublicId: 'invalid/wrong-org/items/image-123'
        },
        userToken
      );

      expect(response.code).toBe('FORBIDDEN');
    });

    it('should successfully create item without cloudinary public ID', async () => {
      const response = await req(
        'POST',
        'dashboard.createItem',
        {
          name: `Item without Image ${faker.string.uuid()}`,
          description: 'Test item without image',
          price: 8.99,
          shelfId: testShelfId
        },
        userToken
      );

      expect(response.status).toBe(SuccessStatus.SUCCESS);
      expect(response.item.cloudinaryPublicId).toBeNull();
    });
  });

  describe('Integration with Shelf Items', () => {
    it('should include cloudinaryPublicId in shelf items response', async () => {
      // Create item with image
      const itemResponse = await req(
        'POST',
        'dashboard.createItem',
        {
          name: `Shelf Item with Image ${faker.string.uuid()}`,
          description: 'Test item for shelf display',
          price: 12.99,
          shelfId: testShelfId,
          cloudinaryPublicId: 'invertar/test-org/items/shelf-test-image'
        },
        userToken
      );

      expect(itemResponse.status).toBe(SuccessStatus.SUCCESS);

      // Get shelf items and verify cloudinaryPublicId is included
      const shelfResponse = await req(
        'GET',
        'dashboard.getShelfItems',
        {
          shelfId: testShelfId
        },
        userToken
      );

      expect(shelfResponse.status).toBe(SuccessStatus.SUCCESS);
      
      const createdItem = shelfResponse.items.find(
        (item: any) => item.id === itemResponse.item.id
      );
      
      expect(createdItem).toBeDefined();
      expect(createdItem.cloudinaryPublicId).toBe('invertar/test-org/items/shelf-test-image');
    });
  });
});