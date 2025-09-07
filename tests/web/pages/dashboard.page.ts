import { Locator, Page, expect } from "@playwright/test";
import BasePage from "./base.page";
import Login from "./login.page";
import { th } from "@faker-js/faker/.";

export default class Dashboard extends BasePage {
    welcomeMessage: Locator;
    usersManagementButton: Locator;
    signOutButton: Locator;
    createFolderButton: Locator;
    createItemButton: Locator;
    foldersContainer: Locator;

    constructor(page: Page) {
        super(page);
        this.welcomeMessage = page.locator('#welcome-message');
        this.usersManagementButton = page.locator('#user-management-button');
        this.signOutButton = page.locator('button:has-text("Sign out")');
        this.createFolderButton = page.locator('button:has-text("Create Folder")').first();
        this.createItemButton = page.locator('button:has-text("Create Item")').first();
        this.foldersContainer = page.locator('[data-testid="folders-container"]');
    }

    async open() {
        await this.goto('/dashboard');
    }

    async shouldBeVisible() {
        await expect(this.welcomeMessage).toBeVisible();
        await expect(this.createFolderButton).toBeVisible();
        await expect(this.createItemButton).toBeVisible();
    }

    async createFolder(name: string) {
        await this.createFolderButton.click();
        await this.page.locator('#folderName').fill(name);
        await this.page.locator('button:has-text("Create Folder")').last().click();
    }

    async createItem(name: string, description: string, price: number, quantity: number, folderId: string) {
        await this.createItemButton.click();
        await this.page.locator('#itemName').fill(name);
        await this.page.locator('#itemDescription').fill(description);
        await this.page.locator('#itemPrice').fill(price.toString());
        await this.page.locator('#itemQuantity').fill(quantity.toString());
        await this.page.locator('#itemFolder').selectOption(folderId);
        await this.page.locator('button:has-text("Create Item")').last().click();
    }

    async getFolderByName(name: string) {
        return this.page.locator(`.folder-item:has-text("${name}")`);
    }

    async waitForSuccessMessage() {
        await expect(this.page.locator('.bg-green-50')).toBeVisible();
    }

    async waitForErrorMessage() {
        await expect(this.page.locator('.bg-red-50')).toBeVisible();
    }

        async signOut()  {
        await this.signOutButton.click();
        return new Login(this.page);
    }
}