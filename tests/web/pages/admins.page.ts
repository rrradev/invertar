import { expect, Locator, Page } from "@playwright/test";
import BasePage from "./base.page";
import SuccessMessage from "./components/success-message.component";
import ErrorMessage from "./components/error-message.component";
import Header from "./components/header.component";
import { th } from "@faker-js/faker/.";

export default class Admins extends BasePage {
    header : Header;
    title: Locator;
    subtitle: Locator;
    createAdminButton: Locator;
    createAdminFormTitle: Locator;
    createAdminFormButton: Locator;
    usernameField: Locator;
    emailField: Locator;
    organizationField: Locator;
    cancelFormButton: Locator;
    successMessage: SuccessMessage;
    errorMessage: ErrorMessage;
    adminRows: Locator;
    deleteAdminButton: Locator;
    refreshOtacButton: Locator;
    resetAdminButton: Locator;

    constructor(page: Page) {
        super(page);
        this.header = Header.from(page);
        this.title = page.locator('h2').first();
        this.subtitle = page.locator('p').first();
        this.createAdminButton = page.locator('button:has-text("Create Admin")').first();
        this.createAdminFormTitle = page.locator('h3').filter({ hasText: 'Create New Admin' });
        this.createAdminFormButton = page.locator('button:has-text("Create Admin")').last();
        this.usernameField = page.locator('#username');
        this.emailField = page.locator('#email');
        this.organizationField = page.locator('#organization');
        this.cancelFormButton = page.locator('button:has-text("Cancel")');
        this.successMessage = SuccessMessage.from(page);
        this.errorMessage = ErrorMessage.from(page);
        this.adminRows = page.locator('tbody tr');
        this.deleteAdminButton = page.locator('button:has-text("Delete Admin")');
        this.refreshOtacButton = page.locator('button:has-text("Refresh OTAC")');
        this.resetAdminButton = page.locator('button:has-text("Reset Admin")');
    }

    async shouldBeVisible(): Promise<void> {
        await this.header.shouldBeVisible();
        await expect(this.title).toHaveText(/Admin Management/);
        await expect(this.subtitle).toContainText('Manage administrators in your app');
    }

    async open() {
        await this.goto('/admins');
        await this.shouldBeVisible();
    }

    async adminsFormShouldBeVisible(): Promise<void> {
        await expect(this.createAdminFormTitle).toBeVisible();
        await expect(this.usernameField).toBeVisible();
        await expect(this.emailField).toBeVisible();
        await expect(this.organizationField).toBeVisible();
        await expect(this.cancelFormButton).toBeVisible();
        await expect(this.createAdminFormButton).toBeVisible();
    }

    async shouldHaveTextInTable(text: string): Promise<void> {
        await expect(this.page.locator(`tr:has-text("${text}")`)).toBeVisible();
    }

    async tableShouldBeVisible(): Promise<void> {
        const table = this.page.locator('table');
        await expect(table).toBeVisible();

        const headers = table.locator('thead th');
        await expect(headers.nth(0)).toContainText('Administrator');
        await expect(headers.nth(1)).toContainText('Email');
        await expect(headers.nth(2)).toContainText('Organization');
        await expect(headers.nth(3)).toContainText('Created');
        await expect(headers.nth(4)).toContainText('OTAC');
        await expect(headers.nth(5)).toContainText('Status');
        await expect(headers.nth(6)).toContainText('Actions');
    }

    async countAdminRows(): Promise<number> {
        return await this.adminRows.count();
    }

    async dropdownMenuShouldBeVisible(): Promise<void> {
        await expect(this.deleteAdminButton).toBeVisible();
        await expect(this.refreshOtacButton).toBeVisible();
        await expect(this.resetAdminButton).toBeVisible();
    }

    async dropdownMenuShouldNotBeVisible(): Promise<void> {
        await expect(this.deleteAdminButton).not.toBeVisible();
        await expect(this.refreshOtacButton).not.toBeVisible();
        await expect(this.resetAdminButton).not.toBeVisible();
    }

    async clickFirstActionsButton(): Promise<void> {
        const rowCount = await this.countAdminRows();
        if (rowCount > 0) {
            // Click on the first admin's actions button (three dots)
            const firstRowActionsButton = this.adminRows.first().locator('button[aria-haspopup="true"]');
            await firstRowActionsButton.click();
        }
        else {
            throw new Error('No admin rows found to click actions button.');
        }
    }
}