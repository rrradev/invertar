import { expect, Locator } from "@playwright/test";
import BaseComponent from "../base.component";
import { get } from "http";

export default class Shelf extends BaseComponent {

    itemsTable: Locator;
    stats: Locator;

    constructor($: Locator) {
        super($);
        this.itemsTable = this.$.locator('[data-testid="items-table"]');
        this.stats = this.$.locator('[data-testid="shelf-stats"]');
    }

    async getShelfId(): Promise<string> {
        return (await this.$.getAttribute('data-shelf-id')) || '';
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
            'Quantity',
            'Unit',
            'Total Value',
            'Last Modified',
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

    async getItemCount(): Promise<number> {
        return parseInt((await this.stats.textContent())?.match(/(\d+) items/)?.[1] || '0');
    }

    async getTotalValue(): Promise<number> {
        return parseFloat((await this.$.getByTestId('shelf-total-value').textContent())?.replace(/[$,]/g, '') || '0');
    }

    async getName(): Promise<string> {
        return (await this.$.getByTestId('shelf-name').textContent()) || '';
    }
}
