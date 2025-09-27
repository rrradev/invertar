import { test, expect } from '../../fixtures/user.fixture';
import { faker } from '@faker-js/faker';

test.describe('Dashboard - Shelf Management', () => {

  test('should show color picker in shelf creation form', async ({ dashboard }) => {
    await dashboard.openCreateShelfForm();

    // Verify shelf color input is visible
    await expect(dashboard.shelfColorInput).toBeVisible();
    
    // Verify default color is set
    const defaultColor = await dashboard.shelfColorInput.inputValue();
    expect(defaultColor).toBe('#10b981');

    await dashboard.cancelShelfCreation();
  });

  test('should create a shelf with custom color successfully', async ({ dashboard }) => {
    const shelfName = `test-shelf-${faker.string.alphanumeric(8)}`;
    const customColor = '#f59e0b';

    // Create shelf with custom color
    await dashboard.createShelf(shelfName, customColor);

    // Verify success message
    await dashboard.waitForSuccessMessage();
    const successMessage = await dashboard.getSuccessMessageText();
    expect(successMessage).toContain(`Shelf "${shelfName}" created successfully`);

    // Find the created shelf
    const shelf = await dashboard.getShelfByName(shelfName);
    await expect(shelf.name).toBeVisible();
  });

  test('should create a shelf with default color when no color specified', async ({ dashboard }) => {
    const shelfName = `test-shelf-${faker.string.alphanumeric(8)}`;

    // Create shelf without specifying color (should use default)
    await dashboard.createShelf(shelfName);

    // Verify success message
    await dashboard.waitForSuccessMessage();
    const successMessage = await dashboard.getSuccessMessageText();
    expect(successMessage).toContain(`Shelf "${shelfName}" created successfully`);

    // Find the created shelf
    const shelf = await dashboard.getShelfByName(shelfName);
    await expect(shelf.name).toBeVisible();
  });

  test('should validate shelf name is required', async ({ dashboard }) => {
    await dashboard.openCreateShelfForm();
    
    // Try to submit without name
    await dashboard.submitShelfButton.click();
    
    // Should show error
    await dashboard.waitForErrorMessage();
    const errorMessage = await dashboard.getErrorMessageText();
    expect(errorMessage).toContain('Shelf name is required');
  });

  test('should reset form when cancelled', async ({ dashboard }) => {
    const shelfName = `test-shelf-${faker.string.alphanumeric(8)}`;
    const customColor = '#8b5cf6';

    // Open form and fill fields
    await dashboard.openCreateShelfForm();
    await dashboard.shelfNameInput.fill(shelfName);
    await dashboard.shelfColorInput.fill(customColor);

    // Cancel form
    await dashboard.cancelShelfCreation();

    // Reopen form and verify fields are reset
    await dashboard.openCreateShelfForm();
    expect(await dashboard.shelfNameInput.inputValue()).toBe('');
    expect(await dashboard.shelfColorInput.inputValue()).toBe('#10b981'); // Should be back to default

    await dashboard.cancelShelfCreation();
  });

  test('should prevent creating shelves with duplicate names', { tag: '@smoke' }, async ({ dashboard }) => {
    const shelfName = `test-shelf-${faker.string.alphanumeric(8)}`;

    // Create first shelf
    await dashboard.createShelf(shelfName, '#10b981');
    await dashboard.waitForSuccessMessage();

    // Try to create duplicate
    await dashboard.createShelf(shelfName, '#f59e0b');
    
    // Should show error
    await dashboard.waitForErrorMessage();
    const errorMessage = await dashboard.getErrorMessageText();
    expect(errorMessage).toContain('Shelf with this name already exists');
  });
});