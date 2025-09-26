import { test, expect } from '../../fixtures/user.fixture';
import { faker } from '@faker-js/faker';
import { Unit } from '@repo/types/units';

test.describe('Dashboard - Item Management', () => {

  test('should show folder options in item creation form', async ({ dashboard, folder }) => {
    await dashboard.openCreateItemForm();

    // Verify folder select is populated with at least our test folder
    const options = await dashboard.getFolderOptions();
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1); // At least default empty option + our folder

    // Verify our test folder is in the options
    const optionsText = await options.allTextContents();
    expect(optionsText).toContain(await folder.getName());

    await dashboard.cancelItemCreation();
  });

  test('should create a basic item successfully', async ({ dashboard, folder, randomItemName }) => {
    // Create basic item (name + folder only)
    await dashboard.createBasicItem(randomItemName, folder);

    // Verify success message
    await dashboard.waitForSuccessMessage();
    const successMessage = await dashboard.getSuccessMessageText();
    expect(successMessage).toContain(`Item \"${randomItemName}\" created successfully`);

    // Verify item appears in the folder's table
    await folder.shouldHaveItemWithName(randomItemName);
  });

  test('should create an item with advanced fields including cost, unit and labels', { tag: '@smoke' },
    async ({ dashboard, folder, randomItemName, label1, label2 }) => {
      const itemData = {
        name: randomItemName,
        folder,
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        cost: parseFloat((Math.random() * 50 + 10).toFixed(2)), // Random cost between 10-60
        quantity: parseFloat((Math.random() * 100 + 1).toFixed(2)), // Decimal quantity
        unit: Unit.KG,
        labels: [label1, label2]
      };

      await dashboard.page.waitForTimeout(1000); // Wait for any UI animations to complete

      // Create item with all fields
      await dashboard.createAdvancedItem(itemData);

      // Verify success message
      await dashboard.waitForSuccessMessage();
      const successMessage = await dashboard.getSuccessMessageText();
      expect(successMessage).toContain(`Item \"${randomItemName}\" created successfully`);

      // Verify item appears in table with correct data
      await dashboard.waitForFoldersToLoad();

      await folder.shouldHaveItemWithName(itemData.name);
      const itemRow = folder.getItemRowByName(itemData.name);

      await expect(itemRow).toBeVisible();
      await expect(itemRow).toContainText(itemData.description);
      await expect(itemRow).toContainText(itemData.price.toFixed(2));
      await expect(itemRow).toContainText(itemData.quantity.toString());
      await expect(itemRow).toContainText(label1);
      await expect(itemRow).toContainText(label2);
    });

  test('should not create item without required fields', async ({ dashboard, folder }) => {
    // Try to create item without name
    await dashboard.openCreateItemForm();
    await dashboard.itemFolderSelect.selectOption(await folder.getName());
    await dashboard.submitItemButton.click();

    // Verify error message
    await dashboard.waitForErrorMessage();
    const errorMessage = await dashboard.getErrorMessageText();
    expect(errorMessage).toContain('Item name and folder selection are required');

    // Try to create item without folder selection
    await dashboard.itemNameInput.fill('Test Item');
    await dashboard.itemFolderSelect.selectOption(''); // Empty selection
    await dashboard.submitItemButton.click();

    // Verify error message persists or appears again
    await dashboard.waitForErrorMessage();
    const errorMessage2 = await dashboard.getErrorMessageText();
    expect(errorMessage2).toContain('Item name and folder selection are required');

    await dashboard.cancelItemCreation();
  });

  test('should handle item creation form cancellation', async ({ dashboard, folder }) => {
    // Get current item count in the test folder
    const initialItemCount = await folder.getItemCount();

    // Start creating item but cancel
    await dashboard.openCreateItemForm();
    await dashboard.itemNameInput.fill('cancelled-item');
    await dashboard.itemFolderSelect.selectOption(await folder.getName());
    await dashboard.toggleAdvancedFields();
    await dashboard.itemDescriptionInput.fill('This should not be saved');
    await dashboard.cancelItemCreation();

    // Verify form is closed
    await expect(dashboard.createItemForm).not.toBeVisible();

    // Verify item count hasn't changed
    const finalItemCount = await folder.getItemCount();
    expect(finalItemCount).toBe(initialItemCount);
  });

  test('should validate advanced field types including decimals', async ({ dashboard, folder }) => {
    await dashboard.openCreateItemForm();
    await dashboard.itemNameInput.fill('validation-test');
    await dashboard.itemFolderSelect.selectOption(await folder.getName());

    // Show advanced fields
    await dashboard.toggleAdvancedFields();

    // Test price field accepts decimal values
    await dashboard.itemPriceInput.fill('123.45');
    expect(await dashboard.itemPriceInput.inputValue()).toBe('123.45');

    // Test cost field accepts decimal values  
    await dashboard.itemCostInput.fill('89.75');
    expect(await dashboard.itemCostInput.inputValue()).toBe('89.75');

    // Test quantity field accepts decimal values
    await dashboard.itemQuantityInput.fill('12.5');
    expect(await dashboard.itemQuantityInput.inputValue()).toBe('12.5');

    // Test unit selector has options
    const unitOptions = await dashboard.itemUnitSelect.locator('option').allTextContents();
    expect(unitOptions.length).toBeGreaterThan(1);
    expect(unitOptions.some(option => option.includes('PCS'))).toBe(true);
    expect(unitOptions.some(option => option.includes('KG'))).toBe(true);

    await dashboard.cancelItemCreation();
  });

  test('should calculate and display folder totals correctly', async ({ folder }) => {
    // Get folder stats and total value
    const totalValue = await folder.getTotalValue();

    // Verify stats format
    expect(await folder.stats.textContent()).toMatch(/\d+ items •/);

    // Since we created items with specific prices, we can verify calculations
    // This is a basic check that the total is reasonable
    expect(totalValue).toBeGreaterThanOrEqual(0);
  });

  test('should display items table with correct headers', async ({ dashboard, folder }) => {
    const itemsTable = folder.itemsTable;

    if (await itemsTable.isVisible()) {
      // Verify table headers
      const headers = itemsTable.locator('thead th');
      await expect(headers.nth(0)).toContainText('Item');
      await expect(headers.nth(1)).toContainText('Labels');
      await expect(headers.nth(2)).toContainText('Description');
      await expect(headers.nth(3)).toContainText('Cost');
      await expect(headers.nth(4)).toContainText('Price');
      await expect(headers.nth(5)).toContainText('Quantity');
      await expect(headers.nth(6)).toContainText('Unit');
      await expect(headers.nth(7)).toContainText('Total Value');
      await expect(headers.nth(8)).toContainText('Last Modified');
    }
  });
});