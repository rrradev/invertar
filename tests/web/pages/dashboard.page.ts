import { Locator, Page, expect } from "@playwright/test";
import BasePage from "./base.page";
import SuccessMessage from "./components/success-message.component";
import ErrorMessage from "./components/error-message.component";
import Header from "./components/header.component";
import Shelf from "./components/dashboard/shelf.component";

export default class Dashboard extends BasePage {
    header: Header
    // Page elements
    dashboardTitle: Locator;
    createShelfButton: Locator;
    createItemButton: Locator;
    createLabelButton: Locator;

    // Forms
    createShelfForm: Locator;
    createItemForm: Locator;
    createLabelForm: Locator;

    // Form inputs
    shelfNameInput: Locator;
    itemNameInput: Locator;
    itemDescriptionInput: Locator;
    itemPriceInput: Locator;
    itemCostInput: Locator;
    itemQuantityInput: Locator;
    itemUnitSelect: Locator;
    itemShelfSelect: Locator;
    labelNameInput: Locator;
    labelColorInput: Locator;
    addLabel1Button: Locator;
    addLabel2Button: Locator;
    labelSearchInput: Locator;

    // Form buttons
    submitShelfButton: Locator;
    cancelShelfButton: Locator;
    submitItemButton: Locator;
    cancelItemButton: Locator;
    submitLabelButton: Locator;
    cancelLabelButton: Locator;
    toggleAdvancedFieldsButton: Locator;

    // Advanced fields
    advancedFieldsContainer: Locator;

    // Edit Item Modal
    editItemModal: Locator;
    editItemModalTitle: Locator;
    editItemNameInput: Locator;
    editItemDescriptionInput: Locator;
    editItemPriceInput: Locator;
    editItemCostInput: Locator;
    editItemUnitSelect: Locator;
    quantityInput: Locator;
    currentQuantityLabel: Locator;
    quantityChangeLabel: Locator;
    newQuantityLabel: Locator;
    decreaseBy10Button: Locator;
    decreaseBy1Button: Locator;
    increaseBy1Button: Locator;
    increaseBy10Button: Locator;
    updateItemButton: Locator;
    deleteItemButton: Locator;
    closeEditModalBtn: Locator;

    // Delete Confirmation Modal
    deleteConfirmationModal: Locator;
    deleteConfirmationTitle: Locator;
    confirmDeleteButton: Locator;
    cancelDeleteButton: Locator;

    // Content areas
    shelvesContainer: Locator;
    loadingState: Locator;
    emptyState: Locator;
    emptyShelfState: Locator;

    // Messages
    errorMessage: ErrorMessage;
    successMessage: SuccessMessage;

    constructor(page: Page) {
        super(page);

        this.header = Header.from(page);
        // Page elements
        this.dashboardTitle = page.getByTestId('dashboard-title');
        this.createShelfButton = page.getByTestId('create-shelf-button');
        this.createItemButton = page.getByTestId('create-item-button');
        this.createLabelButton = page.getByTestId('create-label-button');

        // Forms
        this.createShelfForm = page.getByTestId('create-shelf-form');
        this.createItemForm = page.getByTestId('create-item-form');
        this.createLabelForm = page.getByTestId('create-label-form');

        // Form inputs
        this.shelfNameInput = page.locator('#shelfName');
        this.itemNameInput = page.locator('#itemName');
        this.itemDescriptionInput = page.locator('#itemDescription');
        this.itemPriceInput = page.locator('#itemPrice');
        this.itemCostInput = page.locator('#itemCost');
        this.itemQuantityInput = page.locator('#itemQuantity');
        this.itemUnitSelect = page.locator('#itemUnit');
        this.itemShelfSelect = page.locator('#itemShelf');
        this.labelNameInput = page.locator('#labelName');
        this.labelColorInput = page.locator('#labelColor');
        this.addLabel1Button = page.getByRole('button', { name: 'Add Label' }).first();
        this.addLabel2Button = page.getByRole('button', { name: 'Add Label' });
        this.labelSearchInput = page.locator('[name="labelSearch"]');

        // Form buttons
        this.submitShelfButton = page.getByTestId('submit-shelf-button');
        this.cancelShelfButton = page.getByTestId('cancel-shelf-button');
        this.submitItemButton = page.getByTestId('submit-item-button');
        this.cancelItemButton = page.getByTestId('cancel-item-button');
        this.submitLabelButton = page.getByTestId('submit-label-button');
        this.cancelLabelButton = page.getByTestId('cancel-label-button');
        this.toggleAdvancedFieldsButton = page.getByTestId('toggle-advanced-fields');

        // Advanced fields
        this.advancedFieldsContainer = page.getByTestId('advanced-fields-container');

        // Edit Item Modal
        this.editItemModal = page.locator('.fixed.inset-0.bg-gray-600.bg-opacity-50');
        this.editItemModalTitle = page.getByTestId('edit-modal-title');
        this.editItemNameInput = page.getByTestId('edit-item-name');
        this.editItemDescriptionInput = page.getByTestId('edit-item-description');
        this.editItemPriceInput = page.getByTestId('edit-item-price');
        this.editItemCostInput = page.getByTestId('edit-item-cost');
        this.editItemUnitSelect = page.getByTestId('edit-item-unit');
        this.quantityInput = page.getByTestId('quantity-input');
        this.currentQuantityLabel = page.getByTestId('current-quantity');
        this.quantityChangeLabel = page.getByTestId('quantity-change');
        this.newQuantityLabel = page.getByTestId('new-quantity');
        this.decreaseBy10Button = page.getByTestId('decrease-10-button');
        this.decreaseBy1Button = page.getByTestId('decrease-1-button');
        this.increaseBy1Button = page.getByTestId('increase-1-button');
        this.increaseBy10Button = page.getByTestId('increase-10-button');
        this.updateItemButton = page.getByTestId('update-item-button');
        this.deleteItemButton = page.getByTestId('delete-item-button');
        this.closeEditModalBtn = page.getByLabel('Close modal');

        // Delete Confirmation Modal
        this.deleteConfirmationModal = page.locator('.fixed.inset-0.bg-gray-600.bg-opacity-50').nth(1);
        this.deleteConfirmationTitle = page.getByTestId('delete-confirmation-title');
        this.confirmDeleteButton = page.getByTestId('confirm-delete-button');
        this.cancelDeleteButton = page.getByTestId('cancel-delete-button');

        // Content areas
        this.shelvesContainer = page.getByTestId('shelves-container');
        this.loadingState = page.getByTestId('loading-state');
        this.emptyState = page.getByTestId('empty-state');
        this.emptyShelfState = page.getByTestId('empty-shelf-state');

        // Messages
        this.errorMessage = ErrorMessage.from(page);
        this.successMessage = SuccessMessage.from(page);
    }

    async open() {
        await this.goto('/dashboard');
    }

    async shouldBeVisible(timeout = 5000) {
        await expect(this.dashboardTitle).toBeVisible({ timeout });
        await expect(this.createShelfButton).toBeVisible();
        await expect(this.createItemButton).toBeVisible();
    }

    async openCreateShelfForm() {
        await this.createShelfButton.click();
        await expect(this.createShelfForm).toBeVisible();
    }

    async openCreateItemForm() {
        await this.createItemButton.click();
        await expect(this.createItemForm).toBeVisible();
    }

    async createShelf(name: string) {
        await this.openCreateShelfForm();
        await this.shelfNameInput.fill(name);
        await this.submitShelfButton.click();
    }

    async cancelShelfCreation() {
        await this.cancelShelfButton.click();
        await expect(this.createShelfForm).not.toBeVisible();
    }

    async createBasicItem(name: string, shelf: Shelf) : Promise<Shelf> {
        await this.openCreateItemForm();
        await this.itemNameInput.fill(name);
        await this.itemShelfSelect.selectOption(await shelf.getShelfId());
        await this.submitItemButton.click();
        return shelf;
    }

    async createAdvancedItem(data: {
        name: string;
        shelf: Shelf;
        description?: string;
        price?: number;
        cost?: number;
        quantity?: number;
        unit?: string;
        labels?: string[];
    }) : Promise<Shelf> {
        await this.openCreateItemForm();
        await this.itemNameInput.fill(data.name);
        await this.itemShelfSelect.selectOption(await data.shelf.getShelfId());

        // Show advanced fields if needed
        if (data.description || data.price || data.cost || data.quantity || data.unit) {
            await this.toggleAdvancedFieldsButton.click();
            await expect(this.advancedFieldsContainer).toBeVisible();

            if (data.description) {
                await this.itemDescriptionInput.fill(data.description);
            }
            if (data.price !== undefined) {
                await this.itemPriceInput.fill(data.price.toString());
            }
            if (data.cost !== undefined) {
                await this.itemCostInput.fill(data.cost.toString());
            }
            if (data.quantity !== undefined) {
                await this.itemQuantityInput.fill(data.quantity.toString());
            }
            if (data.unit) {
                await this.itemUnitSelect.selectOption(data.unit);
            }
            if (data.labels?.[0]) {
                await this.addLabel1(data.labels[0]);
            }
            if (data.labels?.[1]) {
                await this.addLabel2(data.labels[1]);
            }
        }

        await this.submitItemButton.click();
        return data.shelf;
    }

    async cancelItemCreation() {
        await this.cancelItemButton.click();
        await expect(this.createItemForm).not.toBeVisible();
    }

    async toggleAdvancedFields() {
        await this.toggleAdvancedFieldsButton.click();
    }

    async waitForShelvesToLoad() {
        // Wait for either shelves container or empty state to be visible
        await Promise.race([
            expect(this.shelvesContainer).toBeVisible(),
            expect(this.emptyState).toBeVisible()
        ]);
    }

    async getShelfByName(name: string): Promise<Shelf> {
        return new Shelf(this.page.getByTestId('shelf-item').filter({ hasText: name }));
    }

    async getItemsTableForShelf(shelfId: string) {
        return this.page.getByTestId('shelf-item').filter({ has: this.page.locator(`[data-shelf-id="${shelfId}"]`) }).getByTestId('items-table');
    }

    async getShelfStats(shelfId: string) {
        const shelfElement = this.page.getByTestId('shelf-item').filter({ has: this.page.locator(`[data-shelf-id="${shelfId}"]`) });
        return {
            stats: shelfElement.getByTestId('shelf-stats'),
            totalValue: shelfElement.getByTestId('shelf-total-value')
        };
    }

    async getItemRow(itemId: string) {
        return this.page.getByTestId('item-row').filter({ has: this.page.locator(`[data-item-id="${itemId}"]`) });
    }

    async getShelfOptions() {
        return this.itemShelfSelect.locator('option');
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

    // Edit Item Modal Methods
    async openEditModalForItem(itemName: string) {
        await this.page.getByTestId('item-row').filter({ hasText: itemName }).getByTestId('edit-item-button').click();
        await expect(this.editItemModal).toBeVisible();
        await expect(this.editItemModalTitle).toBeVisible();
    }

    async closeEditModal() {
        await this.closeEditModalBtn.click();
        await expect(this.editItemModal).not.toBeVisible();
    }

    async updateItemDetails(data: { name?: string; description?: string; price?: number; cost?: number; unit?: string }) {
        if (data.name !== undefined) {
            await this.editItemNameInput.clear();
            await this.editItemNameInput.fill(data.name);
        }
        if (data.description !== undefined) {
            await this.editItemDescriptionInput.clear();
            await this.editItemDescriptionInput.fill(data.description);
        }
        if (data.price !== undefined) {
            await this.editItemPriceInput.clear();
            await this.editItemPriceInput.fill(data.price.toString());
        }
        if (data.cost !== undefined) {
            await this.editItemCostInput.clear();
            await this.editItemCostInput.fill(data.cost.toString());
        }
        if (data.unit !== undefined) {
            await this.editItemUnitSelect.selectOption(data.unit);
        }
    }

    async adjustQuantityBy(amount: number) {
        if (amount === -10) {
            await this.decreaseBy10Button.click();
        } else if (amount === -1) {
            await this.decreaseBy1Button.click();
        } else if (amount === 1) {
            await this.increaseBy1Button.click();
        } else if (amount === 10) {
            await this.increaseBy10Button.click();
        } else {
            // For custom amounts, directly set the input
            const currentValue = await this.quantityInput.inputValue();
            const newValue = parseInt(currentValue) + amount;
            await this.quantityInput.clear();
            await this.quantityInput.fill(newValue.toString());
        }
    }

    async setQuantityDirectly(quantity: number) {
        await this.quantityInput.clear();
        await this.quantityInput.fill(quantity.toString());
    }

    async submitItemUpdate() {
        await this.updateItemButton.click();

        const safePromises = [
            expect(this.errorMessage.$).toBeVisible().catch(() => undefined),
            expect(this.editItemModal).not.toBeVisible().catch(() => undefined),
        ];

        await Promise.race(safePromises);
    }

    async isUpdateButtonEnabled() {
        return await this.updateItemButton.isEnabled();
    }

    async getQuantityDisplayText() {
        // Get the complete text from the quantity section
        const quantitySection = this.page.locator('.bg-gray-50.p-4.rounded-lg .text-sm').first();
        return await quantitySection.textContent();
    }

    async initiateDeleteItem() {
        await this.deleteItemButton.click();
        await expect(this.deleteConfirmationModal).toBeVisible();
        await expect(this.deleteConfirmationTitle).toBeVisible();
    }

    async confirmDeleteItem() {
        await this.confirmDeleteButton.click();
    }

    async cancelDeleteItem() {
        await this.cancelDeleteButton.click();
        await expect(this.deleteConfirmationModal).not.toBeVisible();
    }

    async waitForModalToClose() {
        await expect(this.editItemModal).not.toBeVisible();
    }

    async getEditModalErrorMessage() {
        const errorMsg = this.editItemModal.locator('.bg-red-50.border.border-red-200.text-red-700');
        if (await errorMsg.isVisible()) {
            return await errorMsg.textContent();
        }
        return null;
    }

    async getEditModalSuccessMessage() {
        const successMsg = this.editItemModal.locator('.bg-green-50.border.border-green-200.text-green-700');
        if (await successMsg.isVisible()) {
            return await successMsg.textContent();
        }
        return null;
    }

    async addLabel1(name: string) {
        await this.addLabel1Button.click();
        await this.labelSearchInput.click();
        await this.labelSearchInput.pressSequentially(name, { delay: 50 });
        await this.page.getByRole('button', { name }).click();
    }

    async addLabel2(name: string) {
        await this.addLabel2Button.click();
        await this.labelSearchInput.click();
        await this.labelSearchInput.pressSequentially(name, { delay: 50 });
        await this.page.getByRole('button', { name }).click();
    }

}