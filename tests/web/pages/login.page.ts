import { Locator, Page } from "@playwright/test";
import BasePage from "./base.page";
import Admins from "./admins.page";
import { expect } from '@playwright/test';


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

    async login(org: string, username: string, password: string) {
        await this.orgInput.fill(org);
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        expect(this.submitButton).toBeDisabled();
        expect(this.submitButton).not.toHaveText('Signing in...');

        return new Admins(this.page);
    }

    async shouldBeVisible() {
        await expect(this.orgInput).toBeVisible();
        await expect(this.usernameInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }
}