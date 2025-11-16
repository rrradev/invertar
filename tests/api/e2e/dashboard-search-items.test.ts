import { describe, it, expect, beforeAll } from 'vitest';
import { req, getToken } from './config/config';
import { faker } from '@faker-js/faker';
import { UserRole } from '@repo/types/users';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc';

interface PaginationInfo {
	totalCount: number;
	totalPages: number;
	page: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

describe('Dashboard - Search and Paginate Items', () => {
	let adminToken: string;
	let shelfId: string;

	beforeAll(async () => {
		// Get admin token
		adminToken = await getToken(UserRole.USER);
		// Create a test shelf
		const shelfName = `Test Shelf ${faker.string.alphanumeric(8)}`;
		const shelfResponse = await req<SuccessResponse<{ shelf: { id: string } }>>(
			'POST',
			'dashboard.createShelf',
			{ name: shelfName },
			adminToken
		);
		shelfId = shelfResponse.shelf.id;

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

		const results = await Promise.all(
			itemsToCreate.map(async (item) => {
				const response = await req<SuccessResponse<{ item: any }>>(
					'POST',
					'dashboard.createItem',
					{
						name: item.name,
						price: item.price,
						shelfId,
						quantity: 1
					},
					adminToken
				);

				expect(response.status).toBe('SUCCESS'); // still asserts per request
				return item.name; // collect name for later
			})
		);
	});

	it('should return paginated items without search query', async () => {
		const response = await req<SuccessResponse<{ items: any[], pagination: PaginationInfo }>>(
			'GET',
			`dashboard.searchShelfItems?input={"shelfId":"${shelfId}","searchQuery":"produ","page":1,"limit":10}`,
			{},
			adminToken

		);
		expect(response.status).toBe('SUCCESS');
		expect(response.items).toBeDefined();
		expect(response.items.length).toBe(10); // First page, limit 10
		expect(response.pagination).toBeDefined();
		expect(response.pagination.totalCount).toBe(15);
		expect(response.pagination.totalPages).toBe(2);
		expect(response.pagination.page).toBe(1);
		expect(response.pagination.hasNextPage).toBe(true);
		expect(response.pagination.hasPreviousPage).toBe(false);
	});

	it('should return second page of paginated items', async () => {
		const response = await req<SuccessResponse<{ items: any[], pagination: PaginationInfo }>>(
			'GET',
			`dashboard.searchShelfItems?input={"shelfId":"${shelfId}","searchQuery":"pro","page":2,"limit":10}`,
			{},
			adminToken
		);

		expect(response.status).toBe('SUCCESS');
		expect(response.items.length).toBe(5); // Second page, only 5 remaining
		expect(response.pagination.page).toBe(2);
		expect(response.pagination.hasNextPage).toBe(false);
		expect(response.pagination.hasPreviousPage).toBe(true);
	});

	it('should return empty results for non-matching search', async () => {
		const response = await req<SuccessResponse<{ items: any[], pagination: PaginationInfo }>>(
			'GET',
			`dashboard.searchShelfItems?input={"shelfId":"${shelfId}","searchQuery":"NonExisting","page":1,"limit":10}`,
			{},
			adminToken
		);

		expect(response.status).toBe('SUCCESS');
		expect(response.items.length).toBe(0);
		expect(response.pagination.totalCount).toBe(0);
		expect(response.pagination.totalPages).toBe(0);
	});

	it('should return error for non-existent shelf', async () => {
		const response = await req<ErrorResponse>(
			'GET',
			`dashboard.searchShelfItems?input={"shelfId":"Nonexisting","searchQuery":"prod","page":1,"limit":10}`,
			{},
			adminToken
		);

		expect(response.data.code).toBe('NOT_FOUND');
	});

	it('should respect limit parameter', async () => {
		const response = await req<SuccessResponse<{ items: any[], pagination: PaginationInfo }>>(
			'GET',
			`dashboard.searchShelfItems?input={"shelfId":"${shelfId}","searchQuery":"pro","page":2,"limit":5}`,
			{},
			adminToken
		);

		expect(response.status).toBe('SUCCESS');
		expect(response.items).toBeDefined();
		expect(response.items.length).toBe(5); // First page, limit 5
		expect(response.pagination).toBeDefined();
		expect(response.pagination.totalCount).toBe(15);
		expect(response.pagination.totalPages).toBe(3); // 15 items / 5 per page
		expect(response.pagination.page).toBe(2);
		expect(response.pagination.hasNextPage).toBe(true);
		expect(response.pagination.hasPreviousPage).toBe(true);
	});
});
