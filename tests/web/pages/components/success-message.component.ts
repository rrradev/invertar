import { Locator, Page } from "@playwright/test";
import BaseComponent from "./base.component";

export default class SuccessMessage extends BaseComponent {
    constructor(page: Page) {
        super(page.locator('.bg-green-50'));
    }

    async getMessageText() {
        return await this.container.textContent();
    }
}
