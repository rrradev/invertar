import { faker } from '@faker-js/faker';
import { test, expect } from '../../fixtures/user.fixture';
import { SuccessResponse } from '@repo/types/trpc';
import { getToken, req } from 'tests/api/e2e/config/config';
import { UserRole } from '@repo/types/users';

const shelfWithItems = faker.commerce.department() + '-items-' + Date.now();

test.describe.serial('Dashboard - Search and Pagination', () => {
	test.beforeAll(async ({ }) => {
		const token = await getToken(UserRole.USER);
		const shelfId = await req<SuccessResponse<{ shelf: { id: string } }>>(
			'POST',
			'dashboard.createShelf',
			{ name: shelfWithItems },
			token
		).then(res => res.shelf.id);

		// Create 12 test items
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
		];

	// create items in parallel for speed
    await Promise.all(
      itemsToCreate.map(item =>
        req<SuccessResponse<{ item: any }>>(
          'POST',
          'dashboard.createItem',
          {
            name: item.name,
            price: item.price,
            shelfId,
            quantity: 1
          },
          token
        )
      )
    );
	});

	test('should search items by name', { tag: '@smoke' }, async ({ dashboard }) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('apple');
		await shelf.shouldHaveItemCount(1);
		await shelf.shouldHaveItemWithName('Apple Product');
		await expect(shelf.getItemCountStats()).resolves.toBe(1);
	});

	test('should show empty state for no search results', async ({ dashboard }) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('nonexistentitem');
		// Should show empty state
		await expect(shelf.emptyState).toBeVisible();
		await expect(shelf.emptyState).toContainText(
			'No items match your search'
		);
	});

	test('should clear search and show all items', async ({ dashboard }) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('ban');
		await shelf.shouldHaveItemCount(1)
		await shelf.shouldHaveItemWithName('Banana Product');
		// Clear search
		await shelf.clearSearch();
		await shelf.shouldHaveItemCount(10);
	});

	test('should display pagination controls when items exceed page limit', async ({
		dashboard
	}) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('product');
		// Should show pagination since we have 12 items (> 10 per page)
		await expect(shelf.nextPageButton).toBeVisible();
		await expect(shelf.prevPageButton.first()).toBeVisible();
		// Check pagination info
		await expect(shelf.paginationControls).toHaveText(/Showing page 1 of  2/);
		await expect(shelf.paginationControls).toHaveText(/12 total items/);
	});

	test('should navigate to next page', async ({ dashboard }) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('product');
		// Go to next page
		await shelf.goToNextPage();
		// Should show page 2
		await expect(shelf.paginationControls).toHaveText(/Showing page 2 of  2/);
		// Should show remaining items (2 items)
		await shelf.shouldHaveItemCount(2);
		// Previous button should be enabled, next should be disabled
		await expect(shelf.prevPageButton).toBeEnabled();
		await expect(shelf.nextPageButton).toBeDisabled();
	});

	test('should navigate back to previous page', async ({ dashboard }) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('product');
		// First go to page 2
		await shelf.goToNextPage();
		await shelf.shouldHaveItemCount(2);
		// Go back to page 1
		await shelf.goToPreviousPage();
		await shelf.shouldHaveItemCount(10);
		// Should show page 1
		await expect(shelf.paginationControls).toHaveText(/Showing page 1 of  2/);
		// Should show 10 items again
		await shelf.shouldHaveItemCount(10);
	});

	test('should click specific page number', async ({ dashboard }) => {
		const shelf = await dashboard.getShelfByName(shelfWithItems);
		await shelf.searchItems('product');
		// Click page 2 button
		await shelf.clickPageNumber(2);
		// Should show page 2
		await expect(shelf.paginationControls).toHaveText(/Showing page 2 of  2/);
	});

	test('should hide search box when shelf is empty', async ({ emptyShelf }) => {
		await expect(emptyShelf.searchInput).not.toBeVisible();
	});
});
