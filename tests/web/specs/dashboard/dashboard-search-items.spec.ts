import { test, expect } from '../fixtures';
import { faker } from '@faker-js/faker';

test.describe('Dashboard - Search and Pagination', () => {
	let shelfName: string;
	let shelfId: string;
	const itemNames: string[] = [];

	test.beforeEach(async ({ authenticatedPage, adminUsername, adminPassword }) => {
		// Navigate to dashboard
		await authenticatedPage.goto('/dashboard');
		await expect(authenticatedPage.locator('[data-testid="dashboard-title"]')).toBeVisible();

		// Create a test shelf
		shelfName = `Search Test Shelf ${faker.string.alphanumeric(6)}`;
		await authenticatedPage.locator('[data-testid="create-shelf-button"]').click();
		await authenticatedPage.locator('#shelfName').fill(shelfName);
		await authenticatedPage.locator('[data-testid="submit-shelf-button"]').click();
		await expect(authenticatedPage.locator('[data-testid="success-message"]')).toBeVisible();

		// Get the shelf element
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		shelfId = (await shelf.getAttribute('data-shelf-id')) || '';

		// Create 12 test items
		const testItems = [
			'Apple Product',
			'Banana Product',
			'Cherry Product',
			'Date Product',
			'Elderberry Product',
			'Fig Product',
			'Grape Product',
			'Honeydew Product',
			'Ice Cream Product',
			'Jackfruit Product',
			'Kiwi Product',
			'Lemon Product'
		];

		for (const itemName of testItems) {
			await authenticatedPage.locator('[data-testid="create-item-button"]').click();
			await authenticatedPage.locator('#itemName').fill(itemName);
			await authenticatedPage.locator('#itemShelf').selectOption(shelfName);
			await authenticatedPage.locator('[data-testid="submit-item-button"]').click();
			await expect(authenticatedPage.locator('[data-testid="success-message"]')).toContainText(
				'created successfully'
			);
			itemNames.push(itemName);
		}

		// Expand the shelf
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		await shelf.locator('[data-testid="shelf-expand-button"]').click();
		await expect(shelf.locator('[data-testid="items-table"]')).toBeVisible({ timeout: 10000 });
	});

	test('should display search input in expanded shelf', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Search box should be visible
		const searchInput = shelf.locator('[data-testid="search-items-input"]');
		await expect(searchInput).toBeVisible();
		await expect(searchInput).toHaveAttribute('placeholder', 'Search items...');
	});

	test('should search items by name with debounce', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		const searchInput = shelf.locator('[data-testid="search-items-input"]');

		// Type search query
		await searchInput.fill('apple');

		// Wait for debounce (250ms) + request
		await authenticatedPage.waitForTimeout(500);

		// Should show only Apple Product
		const itemsTable = shelf.locator('[data-testid="items-table"]');
		const rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(1);
		await expect(rows.first()).toContainText('Apple Product');
	});

	test('should search items case-insensitively', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		const searchInput = shelf.locator('[data-testid="search-items-input"]');

		// Type search query in uppercase
		await searchInput.fill('BANANA');
		await authenticatedPage.waitForTimeout(500);

		// Should find the item
		const itemsTable = shelf.locator('[data-testid="items-table"]');
		const rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(1);
		await expect(rows.first()).toContainText('Banana Product');
	});

	test('should search by partial name match', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		const searchInput = shelf.locator('[data-testid="search-items-input"]');

		// Search for partial match
		await searchInput.fill('berry');
		await authenticatedPage.waitForTimeout(500);

		// Should find Elderberry Product
		const itemsTable = shelf.locator('[data-testid="items-table"]');
		const rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(1);
		await expect(rows.first()).toContainText('Elderberry Product');
	});

	test('should show empty state for no search results', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		const searchInput = shelf.locator('[data-testid="search-items-input"]');

		// Search for non-existent item
		await searchInput.fill('NonExistentItem');
		await authenticatedPage.waitForTimeout(500);

		// Should show empty state
		await expect(shelf.locator('[data-testid="empty-shelf-state"]')).toBeVisible();
		await expect(shelf.locator('[data-testid="empty-shelf-state"]')).toContainText(
			'No items match your search'
		);
	});

	test('should clear search and show all items', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		const searchInput = shelf.locator('[data-testid="search-items-input"]');

		// First search for something
		await searchInput.fill('apple');
		await authenticatedPage.waitForTimeout(500);

		let itemsTable = shelf.locator('[data-testid="items-table"]');
		let rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(1);

		// Clear search
		await searchInput.clear();
		await authenticatedPage.waitForTimeout(500);

		// Should show first page (10 items)
		itemsTable = shelf.locator('[data-testid="items-table"]');
		rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(10);
	});

	test('should display pagination controls when items exceed page limit', async ({
		authenticatedPage
	}) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Should show pagination since we have 12 items (> 10 per page)
		await expect(shelf.locator('[data-testid="prev-page-button"]')).toBeVisible();
		await expect(shelf.locator('[data-testid="next-page-button"]')).toBeVisible();
		await expect(shelf.locator('[data-testid="page-button"]').first()).toBeVisible();

		// Check pagination info
		await expect(shelf.getByText(/Showing page 1 of 2/)).toBeVisible();
		await expect(shelf.getByText(/12 total items/)).toBeVisible();
	});

	test('should navigate to next page', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Click next page button
		await shelf.locator('[data-testid="next-page-button"]').click();
		await authenticatedPage.waitForTimeout(500);

		// Should show page 2
		await expect(shelf.getByText(/Showing page 2 of 2/)).toBeVisible();

		// Should show remaining items (2 items)
		const itemsTable = shelf.locator('[data-testid="items-table"]');
		const rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(2);

		// Previous button should be enabled, next should be disabled
		await expect(shelf.locator('[data-testid="prev-page-button"]')).toBeEnabled();
		await expect(shelf.locator('[data-testid="next-page-button"]')).toBeDisabled();
	});

	test('should navigate back to previous page', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Go to page 2
		await shelf.locator('[data-testid="next-page-button"]').click();
		await authenticatedPage.waitForTimeout(500);
		await expect(shelf.getByText(/Showing page 2 of 2/)).toBeVisible();

		// Go back to page 1
		await shelf.locator('[data-testid="prev-page-button"]').click();
		await authenticatedPage.waitForTimeout(500);

		// Should show page 1
		await expect(shelf.getByText(/Showing page 1 of 2/)).toBeVisible();

		// Should show 10 items again
		const itemsTable = shelf.locator('[data-testid="items-table"]');
		const rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(10);
	});

	test('should click specific page number', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Click page 2 button
		await shelf.locator('[data-testid="page-button"][data-page="2"]').click();
		await authenticatedPage.waitForTimeout(500);

		// Should show page 2
		await expect(shelf.getByText(/Showing page 2 of 2/)).toBeVisible();

		// Page 2 button should be highlighted
		const page2Button = shelf.locator('[data-testid="page-button"][data-page="2"]');
		await expect(page2Button).toHaveClass(/bg-indigo-600/);
	});

	test('should reset to page 1 when searching', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Go to page 2
		await shelf.locator('[data-testid="next-page-button"]').click();
		await authenticatedPage.waitForTimeout(500);
		await expect(shelf.getByText(/Showing page 2 of 2/)).toBeVisible();

		// Now search
		const searchInput = shelf.locator('[data-testid="search-items-input"]');
		await searchInput.fill('Product');
		await authenticatedPage.waitForTimeout(500);

		// Should be back on page 1
		await expect(shelf.getByText(/Showing page 1/)).toBeVisible();
	});

	test('should maintain search query across page navigation', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });
		const searchInput = shelf.locator('[data-testid="search-items-input"]');

		// Search for "Product" which should match all 12 items
		await searchInput.fill('Product');
		await authenticatedPage.waitForTimeout(500);

		// Should show page 1 with 10 items
		await expect(shelf.getByText(/Showing page 1 of 2/)).toBeVisible();

		// Navigate to page 2
		await shelf.locator('[data-testid="next-page-button"]').click();
		await authenticatedPage.waitForTimeout(500);

		// Search input should still contain "Product"
		await expect(searchInput).toHaveValue('Product');

		// Should show page 2 with 2 remaining items
		const itemsTable = shelf.locator('[data-testid="items-table"]');
		const rows = itemsTable.locator('tbody tr');
		await expect(rows).toHaveCount(2);
	});

	test('should update total item count in shelf stats', async ({ authenticatedPage }) => {
		const shelf = authenticatedPage
			.locator('[data-testid="shelf-item"]')
			.filter({ hasText: shelfName });

		// Initial count should be 12 items
		const shelfStats = shelf.locator('[data-testid="shelf-stats"]');
		await expect(shelfStats).toContainText('12 items');

		// Search for specific item
		const searchInput = shelf.locator('[data-testid="search-items-input"]');
		await searchInput.fill('apple');
		await authenticatedPage.waitForTimeout(500);

		// Stats should show 1 item (filtered count)
		await expect(shelfStats).toContainText('1 items');
	});
});
