import { Locator, Page } from "@playwright/test";
import BasePage from "./base.page";
import { expect } from '@playwright/test';
import Dashboard from "./dashboard.page";

export default class Login extends BasePage {
    orgInput: Locator;
    usernameInput: Locator;
    passwordInput: Locator;
    submitButton: Locator;

    constructor(page: Page) {
        super(page)
        this.orgInput = page.locator('input[id="organizationName"]');
        this.usernameInput = page.locator('input[id="username"]');
        this.passwordInput = page.locator('input[id="password"]');
        this.submitButton = page.locator('button[type="submit"]');
    }

    async open() {
        await this.goto('/login');
    }

    async loginAs(org: string, username: string, password: string) {
        await this.orgInput.fill(org);
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        expect(this.submitButton).toBeDisabled();
        await this.page.waitForURL('**/dashboard');

        const dashboard = new Dashboard(this.page);
        await dashboard.shouldBeVisible();

        return dashboard;
    }

    async shouldBeVisible() {
        await expect(this.orgInput).toBeVisible();
        await expect(this.usernameInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }
}