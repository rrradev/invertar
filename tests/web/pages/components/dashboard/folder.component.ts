import { expect, Locator } from "@playwright/test";
import BaseComponent from "../base.component";

export default class Folder extends BaseComponent {

    itemsTable: Locator;
    stats: Locator;

    constructor($: Locator) {
        super($);
        this.itemsTable = this.$.locator('[data-testid="items-table"]');
        this.stats = this.$.locator('[data-testid="folder-stats"]');
    }

    async getFolderId() : Promise<string> {
        return (await this.$.getAttribute('data-folder-id')) || '';
    }

    async shouldHaveItemWithName(name: string) {
        const itemRow = this.itemsTable.getByRole('row').filter({ hasText: name });
        await expect(itemRow).toBeVisible();
    }   

     getItemRowByName(name: string) { 
        return this.itemsTable.getByRole('row').filter({ hasText: name });
    }

    getItemByName(name: string) {
        return this.itemsTable.getByRole('row').filter({ hasText: name });
    }

    async getItemCount() : Promise<number> {
        return parseInt((await this.stats.textContent())?.match(/(\d+) items/)?.[1] || '0');
    }

    async getTotalValue() : Promise<number> {
        return parseFloat((await this.$.getByTestId('folder-total-value').textContent())?.replace(/[$,]/g, '') || '0');
    }
    
    async getName() : Promise<string> {
        return (await this.$.getByTestId('folder-name').textContent()) || '';
    }
}
