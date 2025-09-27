import { test, expect } from '../../fixtures/user.fixture';
import { faker } from '@faker-js/faker';

test.describe('Dashboard - Edit Item Modal', () => {

  test('should open edit modal when clicking on the pencil button', async ({ dashboard, shelf, randomItemName }) => {
    // Create an item to edit
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Open edit modal by clicking on pencil button
    await dashboard.openEditModalForItem(randomItemName);

    // Verify modal is open with correct title
    await expect(dashboard.editItemModalTitle).toBeVisible();
    await expect(dashboard.editItemModalTitle).toContainText('Edit Item');

    // Verify form fields are populated
    await expect(dashboard.editItemNameInput).toHaveValue(randomItemName);

    await dashboard.closeEditModal();
  });

  test('should show item details in edit modal', async ({ dashboard, shelf, randomItemName }) => {
    const itemData = {
      name: randomItemName,
      shelf,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
      quantity: faker.number.int({ min: 5, max: 50 })
    };

    // Create item with full details
    await dashboard.createAdvancedItem(itemData);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Verify all fields are populated correctly
    await expect(dashboard.editItemNameInput).toHaveValue(itemData.name);
    await expect(dashboard.editItemDescriptionInput).toHaveValue(itemData.description);
    await expect(dashboard.editItemPriceInput).toHaveValue(itemData.price.toString());
    await expect(dashboard.quantityInput).toHaveValue(itemData.quantity.toString());

    await dashboard.closeEditModal();
  });

  test('should update item name, description, and price', { tag: '@smoke' }, async ({ dashboard, shelf, randomItemName }) => {
    // Create initial item
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Open edit modal and update details
    await dashboard.openEditModalForItem(randomItemName);

    const updateData = {
      name: `updated-${randomItemName}`,
      description: 'Updated description',
      price: 99.99
    };

    await dashboard.updateItemDetails(updateData);
    await dashboard.submitItemUpdate();

    // Verify success message
    await dashboard.waitForSuccessMessage();
    const successMessage = await dashboard.getSuccessMessageText();
    expect(successMessage).toContain('updated successfully');

    // Verify item appears with updated data in the table
    await shelf.shouldHaveItemWithName(updateData.name);
    const itemRow = shelf.getItemRowByName(updateData.name);
    await expect(itemRow).toContainText(updateData.description);
    await expect(itemRow).toContainText('$99.99');
  });

  test('should adjust quantity using increment/decrement buttons', async ({ dashboard, shelf, randomItemName }) => {
    const initialQuantity = 20;
    const itemData = {
      name: randomItemName,
      shelf,
      quantity: initialQuantity
    };

    // Create item with specific quantity
    await dashboard.createAdvancedItem(itemData);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Test +1 button
    await dashboard.adjustQuantityBy(1);
    await expect(dashboard.quantityInput).toHaveValue((initialQuantity + 1).toString());

    // Test +10 button
    await dashboard.adjustQuantityBy(10);
    await expect(dashboard.quantityInput).toHaveValue((initialQuantity + 11).toString());

    // Test -1 button
    await dashboard.adjustQuantityBy(-1);
    await expect(dashboard.quantityInput).toHaveValue((initialQuantity + 10).toString());

    // Test -10 button
    await dashboard.adjustQuantityBy(-10);
    await expect(dashboard.quantityInput).toHaveValue(initialQuantity.toString());

    await dashboard.closeEditModal();
  });

  test('should show color-coded quantity change display', async ({ dashboard, shelf, randomItemName }) => {
    const initialQuantity = 50;
    const itemData = {
      name: randomItemName,
      shelf,
      quantity: initialQuantity
    };

    // Create item
    await dashboard.createAdvancedItem(itemData);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Test increase quantity (should show green)
    await dashboard.adjustQuantityBy(10);
    const increaseDisplay = await dashboard.getQuantityDisplayText();
    expect(increaseDisplay).toContain(`Current Quantity: ${initialQuantity}  + 10 → ${initialQuantity + 10}`);
    
    // Test decrease quantity (should show red)
    await dashboard.setQuantityDirectly(initialQuantity - 15);
    const decreaseDisplay = await dashboard.getQuantityDisplayText();
    expect(decreaseDisplay).toContain(`Current Quantity: ${initialQuantity}  - 15 → ${initialQuantity - 15}`);

    await dashboard.closeEditModal();
  });

  test('should prevent negative quantities', async ({ dashboard, shelf, randomItemName }) => {
    const initialQuantity = 5;
    const itemData = {
      name: randomItemName,
      shelf,
      quantity: initialQuantity
    };

    // Create item
    await dashboard.createAdvancedItem(itemData);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Test that -10 button is disabled when quantity < 10
    await expect(dashboard.decreaseBy10Button).toBeDisabled();

    // Set quantity to 0
    await dashboard.setQuantityDirectly(0);
    
    // Test that -1 button is disabled when quantity = 0
    await expect(dashboard.decreaseBy1Button).toBeDisabled();

    await dashboard.closeEditModal();
  });

  test('should disable Update button when no changes are made', async ({ dashboard, shelf, randomItemName }) => {
    // Create item
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Initially, Update button should be disabled (no changes)
    await expect(dashboard.updateItemButton).toBeDisabled();

    // Make a change
    await dashboard.updateItemDetails({ name: `changed-${randomItemName}` });

    // Update button should now be enabled
    await expect(dashboard.updateItemButton).toBeEnabled();

    // Revert the change
    await dashboard.updateItemDetails({ name: randomItemName });

    // Update button should be disabled again
    await expect(dashboard.updateItemButton).toBeDisabled();

    await dashboard.closeEditModal();
  });

  test('should show delete confirmation modal', async ({ dashboard, shelf, randomItemName }) => {
    // Create item
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Click delete button
    await dashboard.initiateDeleteItem();

    // Verify confirmation modal appears
    await expect(dashboard.deleteConfirmationTitle).toBeVisible();
    await expect(dashboard.deleteConfirmationTitle).toContainText('Delete Item');

    // Verify item name is shown in confirmation
    const confirmationText = await dashboard.deleteConfirmationModal.textContent();
    expect(confirmationText).toContain(randomItemName);

    // Cancel deletion
    await dashboard.cancelDeleteItem();

    // Verify item still exists
    await dashboard.closeEditModal();
    await shelf.shouldHaveItemWithName(randomItemName);
  });

  test('should delete item when confirmed', { tag: '@smoke' }, async ({ dashboard, shelf, randomItemName }) => {
    // Create item
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Get initial item count
    const initialItemCount = await shelf.getItemCount();

    // Open edit modal and delete item
    await dashboard.openEditModalForItem(randomItemName);
    await dashboard.initiateDeleteItem();
    await dashboard.confirmDeleteItem();

    // Verify success message
    await dashboard.waitForSuccessMessage();
    const successMessage = await dashboard.getSuccessMessageText();
    expect(successMessage).toContain('deleted successfully');

    // Verify item is removed from the table
    const finalItemCount = await shelf.getItemCount();
    expect(finalItemCount).toBe(initialItemCount - 1);

    // Verify item no longer exists in shelf
    await expect(shelf.getItemRowByName(randomItemName)).toHaveCount(0);
  });

  test('should handle validation errors in edit modal', async ({ dashboard, shelf, randomItemName }) => {
    // Create item
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Try to submit with empty name (should fail)
    await dashboard.updateItemDetails({ name: '' });
    await dashboard.submitItemUpdate();

    // Check for error message
    const errorMessage = await dashboard.getEditModalErrorMessage();
    expect(errorMessage).toContain('Item name is required');

    await dashboard.closeEditModal();
  });

  test('should handle concurrent quantity updates properly', { tag: '@smoke' }, async ({ dashboard, shelf, randomItemName }) => {
    const initialQuantity = 100;
    const itemData = {
      name: randomItemName,
      shelf,
      quantity: initialQuantity
    };

    // Create item
    await dashboard.createAdvancedItem(itemData);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Perform multiple quantity adjustments in sequence
    await dashboard.adjustQuantityBy(10);  // +10 = 110
    await dashboard.adjustQuantityBy(-5);  // -5 = 105
    await dashboard.adjustQuantityBy(25);  // +25 = 130

    // Verify final quantity
    await expect(dashboard.quantityInput).toHaveValue('130');

    // Submit changes
    await dashboard.submitItemUpdate();
    await dashboard.waitForSuccessMessage();

    // Verify quantity in table
    const itemRow = shelf.getItemRowByName(randomItemName);
    await expect(itemRow).toContainText('130');
  });

  test('should update item cost and unit correctly', { tag: '@smoke' }, async ({ dashboard, shelf, randomItemName }) => {
    // Create initial item with some basic data
    await dashboard.createBasicItem(randomItemName, shelf);
    await dashboard.waitForSuccessMessage();

    // Open edit modal
    await dashboard.openEditModalForItem(randomItemName);

    // Update cost and unit
    const updateData = {
      cost: 0, 
      unit: 'KG'
    };
    
    await dashboard.updateItemDetails(updateData);
    await dashboard.submitItemUpdate();

    // Verify success message
    await dashboard.waitForSuccessMessage();
    const successMessage = await dashboard.getSuccessMessageText();
    expect(successMessage).toContain('updated successfully');

    // Verify cost field shows 0.00 in the edit modal
    await dashboard.openEditModalForItem(randomItemName);
    await expect(dashboard.editItemCostInput).toHaveValue('0');
    await expect(dashboard.editItemUnitSelect).toHaveValue('KG');
    
    // Verify unit is displayed in the table
    await dashboard.closeEditModal();
    const cellData = await shelf.getItemCellData(randomItemName);
    expect(cellData['Unit']).toBe('KG');
    
    // Test updating cost to a positive number
    await dashboard.openEditModalForItem(randomItemName);
    await dashboard.updateItemDetails({ cost: 25.50, unit: 'L' });
    await dashboard.submitItemUpdate();
    await dashboard.waitForSuccessMessage();
    
    // Verify the positive cost and new unit
    await dashboard.openEditModalForItem(randomItemName);
    await expect(dashboard.editItemCostInput).toHaveValue('25.5');
    await expect(dashboard.editItemUnitSelect).toHaveValue('L');
    await dashboard.closeEditModal();

    const updatedCellData = await shelf.getItemCellData(randomItemName);
    expect(updatedCellData['Unit']).toBe('L');
    expect(updatedCellData['Cost']).toBe('$25.50');

    await dashboard.page.reload();
    await shelf.shouldHaveItemWithName(randomItemName);
    const reloadedCellData = await shelf.getItemCellData(randomItemName);
    expect(reloadedCellData['Unit']).toBe('L');
    expect(reloadedCellData['Cost']).toBe('$25.50');
  });
});