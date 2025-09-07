import { expect, Locator, Page } from "@playwright/test";
import BasePage from "./base.page";

export default class Admins extends BasePage {
    title: Locator
    welcomeMessage: Locator;
    signOutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.locator('h2').first();
        this.welcomeMessage = page.locator('#welcome-message');
        this.signOutButton = this.welcomeMessage.locator('xpath=following-sibling::button');
    }

    async shouldBeVisible(): Promise<void> {
        await this.welcomeMessage.waitFor({ state: 'visible' });
        await this.signOutButton.waitFor({ state: 'visible' });
        await expect(this.title).toHaveText(/Admin Management/);
    }

    async open() {
        await this.goto('/admins');
        await this.shouldBeVisible();
    }

    async getWelcomeMessageText(): Promise<string> {
        return await this.welcomeMessage.textContent() ?? '';
    }
}