import { describe, it, expect, beforeAll } from 'vitest';
import { req, getToken } from './config/config';
import { faker } from '@faker-js/faker';

describe('Dashboard - Search and Paginate Items', () => {
	let adminToken: string;
	let shelfId: string;
	let testOrg: string;
	const itemNames: string[] = [];

	beforeAll(async () => {
		// Get admin token
		const { token, organizationName } = await getToken('ADMIN');
		adminToken = token;
		testOrg = organizationName;

		// Create a test shelf
		const shelfName = `Test Shelf ${faker.string.alphanumeric(8)}`;
		const shelfResponse = await req({
			method: 'POST',
			path: '/dashboard.createShelf',
			token: adminToken,
			body: { name: shelfName }
		});
		expect(shelfResponse.status).toBe(200);
		expect(shelfResponse.data.result.data.status).toBe('SUCCESS');
		shelfId = shelfResponse.data.result.data.shelf.id;

		// Create 15 test items with predictable names
		const itemsToCreate = [
			{ name: 'Apple Product', price: 10 },
			{ name: 'Banana Product', price: 5 },
			{ name: 'Cherry Product', price: 15 },
			{ name: 'Date Product', price: 20 },
			{ name: 'Elderberry Product', price: 25 },
			{ name: 'Fig Product', price: 30 },
			{ name: 'Grape Product', price: 12 },
			{ name: 'Honeydew Product', price: 8 },
			{ name: 'Ice Cream Product', price: 18 },
			{ name: 'Jackfruit Product', price: 22 },
			{ name: 'Kiwi Product', price: 16 },
			{ name: 'Lemon Product', price: 9 },
			{ name: 'Mango Product', price: 14 },
			{ name: 'Nectarine Product', price: 11 },
			{ name: 'Orange Product', price: 13 }
		];

		for (const item of itemsToCreate) {
			const response = await req({
				method: 'POST',
				path: '/dashboard.createItem',
				token: adminToken,
				body: {
					name: item.name,
					price: item.price,
					shelfId: shelfId,
					quantity: 1
				}
			});
			expect(response.status).toBe(200);
			itemNames.push(item.name);
		}
	});

	it('should return paginated items without search query', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					page: 1,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items).toBeDefined();
		expect(response.data.result.data.items.length).toBe(10); // First page, limit 10
		expect(response.data.result.data.pagination).toBeDefined();
		expect(response.data.result.data.pagination.totalCount).toBe(15);
		expect(response.data.result.data.pagination.totalPages).toBe(2);
		expect(response.data.result.data.pagination.page).toBe(1);
		expect(response.data.result.data.pagination.hasNextPage).toBe(true);
		expect(response.data.result.data.pagination.hasPreviousPage).toBe(false);
	});

	it('should return second page of paginated items', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					page: 2,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items.length).toBe(5); // Second page, only 5 remaining
		expect(response.data.result.data.pagination.page).toBe(2);
		expect(response.data.result.data.pagination.hasNextPage).toBe(false);
		expect(response.data.result.data.pagination.hasPreviousPage).toBe(true);
	});

	it('should search items by name (case insensitive)', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					searchQuery: 'apple',
					page: 1,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items.length).toBe(1);
		expect(response.data.result.data.items[0].name).toBe('Apple Product');
		expect(response.data.result.data.pagination.totalCount).toBe(1);
	});

	it('should search items by partial name match', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					searchQuery: 'berry',
					page: 1,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items.length).toBe(1);
		expect(response.data.result.data.items[0].name).toBe('Elderberry Product');
	});

	it('should return empty results for non-matching search', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					searchQuery: 'NonExistentItem',
					page: 1,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items.length).toBe(0);
		expect(response.data.result.data.pagination.totalCount).toBe(0);
		expect(response.data.result.data.pagination.totalPages).toBe(0);
	});

	it('should handle search with pagination', async () => {
		// Search for "Product" which should match all 15 items
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					searchQuery: 'Product',
					page: 1,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items.length).toBe(10);
		expect(response.data.result.data.pagination.totalCount).toBe(15);
		expect(response.data.result.data.pagination.hasNextPage).toBe(true);
	});

	it('should return error for non-existent shelf', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId: 'non-existent-shelf-id',
					page: 1,
					limit: 10
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.error).toBeDefined();
		expect(response.data.error.data.code).toBe('NOT_FOUND');
	});

	it('should respect limit parameter', async () => {
		const response = await req({
			method: 'GET',
			path: '/dashboard.searchShelfItems',
			token: adminToken,
			query: {
				input: JSON.stringify({
					shelfId,
					page: 1,
					limit: 5
				})
			}
		});

		expect(response.status).toBe(200);
		expect(response.data.result.data.status).toBe('SUCCESS');
		expect(response.data.result.data.items.length).toBe(5);
		expect(response.data.result.data.pagination.limit).toBe(5);
		expect(response.data.result.data.pagination.totalPages).toBe(3); // 15 items / 5 per page
	});
});
