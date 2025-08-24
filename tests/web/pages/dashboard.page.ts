import { Locator, Page } from "@playwright/test";
import BasePage from "./base.page";

export default class DashboardPage extends BasePage {
    welcomeMessage: Locator;
    signOutButton: Locator;

    constructor(page: Page) {
        super(page)
        this.welcomeMessage = page.locator('#welcome-message');
        this.signOutButton = this.welcomeMessage.locator('xpath=following-sibling::button');
    }

    async open() {
        await this.goto('/dashboard');
    }
}