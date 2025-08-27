import { Locator, Page } from "@playwright/test";
import BasePage from "./base.page";
import Login from "./login.page";

export default class Admins extends BasePage {
    welcomeMessage: Locator;
    signOutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.welcomeMessage = page.locator('#welcome-message');
        this.signOutButton = this.welcomeMessage.locator('xpath=following-sibling::button');
    }

    async shouldBeVisible(): Promise<void> {
        await this.welcomeMessage.waitFor({ state: 'visible' });
        await this.signOutButton.waitFor({ state: 'visible' });
    }

    async open() {
        await this.goto('/admins');
        await this.shouldBeVisible();
    }

    async getWelcomeMessageText(): Promise<string> {
        return await this.welcomeMessage.textContent() ?? '';
    }

    async signOut()  {
        await this.signOutButton.click();
        return new Login(this.page);
    }
}