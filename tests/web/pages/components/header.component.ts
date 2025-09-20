import { expect, Locator, Page } from "@playwright/test";
import BaseComponent from "./base.component";
import Login from "../login.page";

export default class Header extends BaseComponent {

    userManagementButton: Locator;
    welcomeMessage: Locator;
    signOutButton: Locator;

    constructor($: Locator) {
        super($);
        this.userManagementButton = $.locator('#user-management-button');
        this.welcomeMessage = $.locator('#welcome-message');
        this.signOutButton = this.welcomeMessage.locator('xpath=following-sibling::button');
    }

    static from(page: Page) {
        return new Header(page.locator("header"));
    }

    async getWelcomeMessage() {
        return await this.welcomeMessage.textContent();
    }

    async clickSignOut() {
        await this.signOutButton.click();
    }

    async shouldBeVisible() {
        await expect(this.welcomeMessage).toBeVisible();
        await expect(this.signOutButton).toBeVisible();
    }
}
