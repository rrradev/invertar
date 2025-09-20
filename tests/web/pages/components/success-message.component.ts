import { Locator, Page } from "@playwright/test";
import BaseComponent from "./base.component";

export default class SuccessMessage extends BaseComponent {
    constructor($: Locator) {
        super($);
    }

    static from(page: Page) {
        return new SuccessMessage(page.locator(".bg-green-50"));
    }

    async getMessageText() {
        return await this.$.textContent();
    }
}
