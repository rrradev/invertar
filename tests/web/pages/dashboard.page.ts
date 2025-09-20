import { Locator, Page, expect } from "@playwright/test";
import BasePage from "./base.page";
import SuccessMessage from "./components/success-message.component";
import ErrorMessage from "./components/error-message.component";
import Header from "./components/header.component";
import Folder from "./components/dashboard/folder.component";

export default class Dashboard extends BasePage {
    header: Header
    // Page elements
    dashboardTitle: Locator;
    createFolderButton: Locator;
    createItemButton: Locator;
    
    // Forms
    createFolderForm: Locator;
    createItemForm: Locator;
    
    // Form inputs
    folderNameInput: Locator;
    itemNameInput: Locator;
    itemDescriptionInput: Locator;
    itemPriceInput: Locator;
    itemQuantityInput: Locator;
    itemFolderSelect: Locator;
    
    // Form buttons
    submitFolderButton: Locator;
    cancelFolderButton: Locator;
    submitItemButton: Locator;
    cancelItemButton: Locator;
    toggleAdvancedFieldsButton: Locator;
    
    // Advanced fields
    advancedFieldsContainer: Locator;
    
    // Content areas
    foldersContainer: Locator;
    loadingState: Locator;
    emptyState: Locator;
    emptyFolderState: Locator;
    
    // Messages
    errorMessage: ErrorMessage;
    successMessage: SuccessMessage;

    constructor(page: Page) {
        super(page);
        
        this.header = Header.from(page);
        // Page elements
        this.dashboardTitle = page.getByTestId('dashboard-title');
        this.createFolderButton = page.getByTestId('create-folder-button');
        this.createItemButton = page.getByTestId('create-item-button');
        
        // Forms
        this.createFolderForm = page.getByTestId('create-folder-form');
        this.createItemForm = page.getByTestId('create-item-form');
        
        // Form inputs
        this.folderNameInput = page.locator('#folderName');
        this.itemNameInput = page.locator('#itemName');
        this.itemDescriptionInput = page.locator('#itemDescription');
        this.itemPriceInput = page.locator('#itemPrice');
        this.itemQuantityInput = page.locator('#itemQuantity');
        this.itemFolderSelect = page.locator('#itemFolder');
        
        // Form buttons
        this.submitFolderButton = page.getByTestId('submit-folder-button');
        this.cancelFolderButton = page.getByTestId('cancel-folder-button');
        this.submitItemButton = page.getByTestId('submit-item-button');
        this.cancelItemButton = page.getByTestId('cancel-item-button');
        this.toggleAdvancedFieldsButton = page.getByTestId('toggle-advanced-fields');
        
        // Advanced fields
        this.advancedFieldsContainer = page.getByTestId('advanced-fields-container');
        
        // Content areas
        this.foldersContainer = page.getByTestId('folders-container');
        this.loadingState = page.getByTestId('loading-state');
        this.emptyState = page.getByTestId('empty-state');
        this.emptyFolderState = page.getByTestId('empty-folder-state');
        
        // Messages
        this.errorMessage = ErrorMessage.from(page);
        this.successMessage = SuccessMessage.from(page);
    }

    async open() {
        await this.goto('/dashboard');
    }

    async shouldBeVisible() {
        await expect(this.dashboardTitle).toBeVisible();
        await expect(this.createFolderButton).toBeVisible();
        await expect(this.createItemButton).toBeVisible();
    }

    async openCreateFolderForm() {
        await this.createFolderButton.click();
        await expect(this.createFolderForm).toBeVisible();
    }

    async openCreateItemForm() {
        await this.createItemButton.click();
        await expect(this.createItemForm).toBeVisible();
    }

    async createFolder(name: string) {
        await this.openCreateFolderForm();
        await this.folderNameInput.fill(name);
        await this.submitFolderButton.click();
    }

    async cancelFolderCreation() {
        await this.cancelFolderButton.click();
        await expect(this.createFolderForm).not.toBeVisible();
    }

    async createBasicItem(name: string, folder: Folder) {
        await this.openCreateItemForm();
        await this.itemNameInput.fill(name);
        await this.itemFolderSelect.selectOption(await folder.getFolderId());
        await this.submitItemButton.click();
    }

    async createAdvancedItem(data: { 
        name: string; 
        folder: Folder; 
        description?: string; 
        price?: number; 
        quantity?: number; 
    }) {
        await this.openCreateItemForm();
        await this.itemNameInput.fill(data.name);
        await this.itemFolderSelect.selectOption(await data.folder.getFolderId());
        
        // Show advanced fields if needed
        if (data.description || data.price || data.quantity) {
            await this.toggleAdvancedFieldsButton.click();
            await expect(this.advancedFieldsContainer).toBeVisible();
            
            if (data.description) {
                await this.itemDescriptionInput.fill(data.description);
            }
            if (data.price !== undefined) {
                await this.itemPriceInput.fill(data.price.toString());
            }
            if (data.quantity !== undefined) {
                await this.itemQuantityInput.fill(data.quantity.toString());
            }
        }
        
        await this.submitItemButton.click();
    }

    async cancelItemCreation() {
        await this.cancelItemButton.click();
        await expect(this.createItemForm).not.toBeVisible();
    }

    async toggleAdvancedFields() {
        await this.toggleAdvancedFieldsButton.click();
    }

    async waitForFoldersToLoad() {
        // Wait for either folders container or empty state to be visible
        await Promise.race([
            expect(this.foldersContainer).toBeVisible(),
            expect(this.emptyState).toBeVisible()
        ]);
    }

    async getFolderByName(name: string) : Promise<Folder> {
        return new Folder(this.page.getByTestId('folder-item').filter({ hasText: name }));
    }

    async getItemsTableForFolder(folderId: string) {
        return this.page.getByTestId('folder-item').filter({ has: this.page.locator(`[data-folder-id="${folderId}"]`) }).getByTestId('items-table');
    }

    async getFolderStats(folderId: string) {
        const folderElement = this.page.getByTestId('folder-item').filter({ has: this.page.locator(`[data-folder-id="${folderId}"]`) });
        return {
            stats: folderElement.getByTestId('folder-stats'),
            totalValue: folderElement.getByTestId('folder-total-value')
        };
    }

    async getItemRow(itemId: string) {
        return this.page.getByTestId('item-row').filter({ has: this.page.locator(`[data-item-id="${itemId}"]`) });
    }

    async getFolderOptions() {
        return this.itemFolderSelect.locator('option');
    }

    async waitForSuccessMessage() {
        await expect(this.page.getByTestId('success-message')).toBeVisible();
    }

    async waitForErrorMessage() {
        await expect(this.page.getByTestId('error-message')).toBeVisible();
    }

    async getSuccessMessageText() {
        return await this.page.getByTestId('success-message').textContent();
    }

    async getErrorMessageText() {
        return await this.page.getByTestId('error-message').textContent();
    }
}