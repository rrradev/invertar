import { expect, Locator } from "@playwright/test";
import BaseComponent from "../base.component";
export default class Shelf extends BaseComponent {

    itemsTable: Locator;
    stats: Locator;
    expandButton: Locator;
    emptyState: Locator;
    totalValue: Locator;
    shelfName: Locator;
    searchInput: Locator;
    paginationControls: Locator;
    prevPageButton: Locator;
    nextPageButton: Locator;

    constructor($: Locator) {
        super($);
        this.itemsTable = this.$.locator('[data-testid="items-table"]');
        this.stats = this.$.locator('[data-testid="shelf-stats"]');
        this.expandButton = this.$.locator('[data-testid="shelf-expand-button"]');
        this.emptyState = this.$.locator('[data-testid="empty-shelf-state"]');
        this.totalValue = this.$.locator('[data-testid="shelf-total-value"]');
        this.shelfName = this.$.locator('[data-testid="shelf-name"]');
        this.searchInput = this.$.locator('[data-testid="search-items-input"]');
        this.paginationControls = this.$.locator('[data-testid="pagination-controls"]');    
        this.prevPageButton = this.$.locator('[data-testid="prev-page-button"]');
        this.nextPageButton = this.$.locator('[data-testid="next-page-button"]');
    }

    async getShelfId(): Promise<string> {
        return (await this.$.getAttribute('data-shelf-id')) || '';
    }

    async getShelfName(): Promise<string> {
        return (await this.shelfName.textContent()) || '';
    }

    async isExpanded(): Promise<boolean> {
        const ariaLabel = await this.expandButton.getAttribute('aria-label');
        return ariaLabel?.includes('Collapse') || false;
    }

    async isCollapsed(): Promise<boolean> {
        return !(await this.isExpanded());
    }

    async expand(): Promise<void> {
        if (await this.isCollapsed()) {
            await this.expandButton.click();
            // Wait for loading to complete
            await expect(this.expandButton.locator('svg.animate-spin')).not.toBeVisible({ timeout: 5000 });
        }
    }

    async collapse(): Promise<void> {
        if (await this.isExpanded()) {
            await this.expandButton.click();
            // Small wait for UI to update
            await this.$.page().waitForTimeout(500);
        }
    }

    async toggleExpansion(): Promise<void> {
        await this.expandButton.click();
        // Wait for state change
        await this.$.page().waitForTimeout(500);
    }

    async shouldBeExpanded(): Promise<void> {
        await expect(this.expandButton).toHaveAttribute('aria-label', /Collapse shelf/);
    }

    async shouldBeCollapsed(): Promise<void> {
        await expect(this.expandButton).toHaveAttribute('aria-label', /Expand shelf/);
    }

    async shouldHaveItemWithName(name: string) {
        const itemRow = this.itemsTable.getByRole('row').filter({ hasText: name });
        await expect(itemRow).toBeVisible();
    }

    getItemRowByName(name: string) {
        return this.itemsTable.getByRole('row').filter({ hasText: name });
    }

    async getItemCellData(itemName: string) {
        const row = this.getItemRowByName(itemName);

        const cells = row.locator('td');
        const count = await cells.count();

        // keep column order in sync with your table
        const columns = [
            'Item',
            'Labels',
            'Description',
            'Cost',
            'Price',
            'Total Value',
            'Unit',
            'Actions',
        ];

        if (count !== columns.length) {
            throw new Error(
                `Column mismatch: expected ${columns.length}, got ${count}`
            );
        }

        const result: Record<string, string> = {};
        for (let i = 0; i < count; i++) {
            result[columns[i]] = (await cells.nth(i).innerText()).trim();
        }

        return result;
    }

    async getItemCountStats(): Promise<number> {
        return parseInt((await this.stats.textContent())?.match(/(\d+) items/)?.[1] || '0');
    }

    async getTotalValue(): Promise<number> {
        return parseFloat((await this.$.getByTestId('shelf-total-value').textContent())?.replace(/[$,]/g, '') || '0');
    }

    async getName(): Promise<string> {
        return (await this.$.getByTestId('shelf-name').textContent()) || '';
    }

    // Search methods
    async searchItems(query: string): Promise<void> {
        await this.searchInput.fill(query);
        // Wait for debounce (250ms) + request
        await this.$.page().waitForTimeout(500);
    }

    async clearSearch(): Promise<void> {
        await this.searchInput.clear();
        await this.$.page().waitForTimeout(500);
    }

    async getSearchQuery(): Promise<string> {
        return (await this.searchInput.inputValue()) || '';
    }

    // Pagination methods
    async goToNextPage(): Promise<void> {
        await this.nextPageButton.click();
        await this.$.page().waitForTimeout(500);
    }

    async goToPreviousPage(): Promise<void> {
        await this.prevPageButton.click();
        await this.$.page().waitForTimeout(500);
    }

    async goToPage(pageNumber: number): Promise<void> {
        const pageButton = this.$.locator(`[data-testid="page-button"][data-page="${pageNumber}"]`);
        await pageButton.click();
        await this.$.page().waitForTimeout(500);
    }

    async getCurrentPage(): Promise<number> {
        const text = await this.$.textContent();
        const match = text?.match(/Showing page (\d+) of \d+/);
        return match ? parseInt(match[1]) : 1;
    }

    async getTotalPages(): Promise<number> {
        const text = await this.$.textContent();
        const match = text?.match(/Showing page \d+ of (\d+)/);
        return match ? parseInt(match[1]) : 1;
    }

    async isNextPageEnabled(): Promise<boolean> {
        return !(await this.nextPageButton.isDisabled());
    }

    async isPreviousPageEnabled(): Promise<boolean> {
        return !(await this.prevPageButton.isDisabled());
    }

    async shouldHaveItemCount(count: number): Promise<void> {
        const rows = this.itemsTable.locator('tbody tr');
        await expect(rows).toHaveCount(count);
    }

    async clickPageNumber(pageNumber: number): Promise<void> {
        const pageButton = this.$.locator('[data-testid="page-button"]', {
            hasText: pageNumber.toString(),
        });
        await pageButton.click();
    }
}

