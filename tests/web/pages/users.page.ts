import { Locator, Page, expect } from "@playwright/test";
import BasePage from "./base.page";

export default class Users extends BasePage {
    welcomeMessage: Locator;
    signOutButton: Locator;
    createUserButton: Locator;
    usernameInput: Locator;
    createButton: Locator;
    cancelButton: Locator;
    usersTable: Locator;
    successAlert: Locator;
    errorAlert: Locator;

    constructor(page: Page) {
        super(page);
        this.welcomeMessage = page.locator('text=/Welcome,/');
        this.signOutButton = page.locator('button:has-text("Sign out")');
        this.createUserButton = page.locator('button:has-text("Create User")');
        this.usernameInput = page.locator('input[name="username"]');
        this.createButton = page.locator('button:has-text("Create")');
        this.cancelButton = page.locator('button:has-text("Cancel")');
        this.usersTable = page.locator('table');
        this.successAlert = page.locator('.alert-success, .text-green-600');
        this.errorAlert = page.locator('.alert-error, .text-red-600');
    }

    async open() {
        await this.goto('/users');
    }

    async shouldBeVisible() {
        await expect(this.welcomeMessage).toBeVisible();
        await expect(this.createUserButton).toBeVisible();
        await expect(this.usersTable).toBeVisible();
    }

    async createUser(username: string) {
        await this.createUserButton.click();
        await this.usernameInput.fill(username);
        await this.createButton.click();
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
        const rows = this.usersTable.locator('tbody tr');
        return await rows.count();
    }

    async isUserInTable(username: string) {
        const userRow = this.page.locator(`tr:has-text("${username}")`);
        return await userRow.count() > 0;
    }
}