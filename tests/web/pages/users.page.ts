import { Locator, Page, expect } from "@playwright/test";
import BasePage from "./base.page";

export default class Users extends BasePage {
    title: Locator
    welcomeMessage: Locator;
    signOutButton: Locator;
    createUserButton: Locator;
    createUserForm: Locator;
    usernameInput: Locator;
    createUserFormButton: Locator;
    cancelButton: Locator;
    usersTable: Locator;
    successAlert: Locator;
    errorAlert: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.locator('h2').first();
        this.welcomeMessage = page.locator('text=/Welcome,/');
        this.signOutButton = page.locator('button:has-text("Sign out")');
        this.createUserButton = page.locator('button:has-text("Create User")');
        this.createUserForm = page.locator('#create-user-form');
        this.usernameInput = this.createUserForm.locator('input[id="username"]');
        this.createUserFormButton = this.createUserForm.locator('button:has-text("Create User")');
        this.cancelButton = this.createUserForm.locator('button:has-text("Cancel")');
        this.usersTable = page.locator('table');
        this.successAlert = page.locator('#success-message');
        this.errorAlert = page.locator('#error-message');
    }

    async open() {
        await this.goto('/users');
    }

    async shouldBeVisible() {
        await expect(this.welcomeMessage).toBeVisible();
        await expect(this.createUserButton).toBeVisible();
        await expect(this.usersTable).toBeVisible();
        await expect(this.title).toHaveText(/User Management/);
    }

    async createUser(username: string) {
        await this.createUserButton.click();
        await this.usernameInput.fill(username);
        await this.createUserFormButton.click();
    }

    async cancelCreateUser() {
        await this.createUserButton.click();
        await this.cancelButton.click();
    }

    async openUserActionsDropdown(username: string) {
        // Find the row containing the username and click the actions button
        const userRow = this.page.locator(`tr:has-text("${username}")`);
        const actionsButton = userRow.locator('button').last(); // Actions dropdown button
        await actionsButton.click();
    }

    async deleteUser(username: string) {
        await this.openUserActionsDropdown(username);
        await this.page.locator('text="Delete User"').click();

        // Confirm deletion in modal
        const confirmButton = this.page.locator('button:has-text("Delete")');
        await confirmButton.click();
    }

    async resetUser(username: string) {
        await this.openUserActionsDropdown(username);
        await this.page.locator('text="Reset User"').click();

        // Confirm reset in modal
        const confirmButton = this.page.locator('button:has-text("Reset")');
        await confirmButton.click();
    }

    async getUserRowData(username: string) {
        const userRow = this.page.locator(`tr:has-text("${username}")`);
        const cells = userRow.locator('td');

        return {
            username: await cells.nth(0).textContent(),
            createdAt: await cells.nth(1).textContent(),
            otac: await cells.nth(2).textContent(),
            status: await cells.nth(3).textContent(),
        };
    }

    async waitForUsersTableToLoad() {
        await this.usersTable.waitFor({ state: 'visible' });
    }

    async getUsersTableRowCount() {
        // Get table rows excluding header
        await this.waitForUsersTableToLoad();
        const rows = this.usersTable.locator('tbody tr');
        return await rows.count();
    }

    async isUserInTable(username: string) {
        const userRow = this.page.locator(`tr:has-text("${username}")`);
        return await userRow.count() > 0;
    }

    async getFirstUsernameInTable() {
        const firstRow = this.usersTable.locator('tbody tr').first();
        return (await firstRow.locator('td').nth(0).textContent())?.split(' ')[1] || '';
    }
}