import { Locator, Page } from "@playwright/test";
import BaseComponent from "./base.component";

export default class ErrorMessage extends BaseComponent {
    constructor($: Locator) {
        super($);
    }

    static from(page: Page) {
        return new ErrorMessage(page.locator(".bg-red-50"));
    }

    async getMessageText() {
        return await this.$.textContent();
    }
}
