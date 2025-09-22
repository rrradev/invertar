import { test, expect } from '@playwright/test';
import Dashboard from '../../pages/dashboard.page';
import { UserRole } from '@repo/types/users/roles';
import { users } from '../../fixtures/users';

test.describe('Dashboard - Labels UI', () => {
  let dashboard: Dashboard;

  test.beforeEach(async ({ page }) => {
    dashboard = new Dashboard(page);
  });

  test('should display create label button for users', async () => {
    // Login as user
    await dashboard.login(users[UserRole.USER]);
    await dashboard.shouldBeVisible();

    // Check that the create label button is visible
    await expect(dashboard.page.getByTestId('create-label-button')).toBeVisible();
    
    // Verify button text and styling
    const createLabelButton = dashboard.page.getByTestId('create-label-button');
    await expect(createLabelButton).toContainText('Create Label');
    
    // Check that it has the expected purple gradient styling
    await expect(createLabelButton).toHaveClass(/from-purple-600.*to-violet-600/);
  });

  test('should display create label button for admins', async () => {
    // Login as admin
    await dashboard.login(users[UserRole.ADMIN]);
    await dashboard.shouldBeVisible();

    // Check that the create label button is visible
    await expect(dashboard.page.getByTestId('create-label-button')).toBeVisible();
  });

  test('should open and close create label form', async () => {
    // Login as user
    await dashboard.login(users[UserRole.USER]);
    await dashboard.shouldBeVisible();

    // Form should not be visible initially
    await expect(dashboard.page.getByTestId('create-label-form')).not.toBeVisible();

    // Click create label button
    await dashboard.page.getByTestId('create-label-button').click();

    // Form should now be visible
    await expect(dashboard.page.getByTestId('create-label-form')).toBeVisible();
    
    // Check form elements
    await expect(dashboard.page.locator('#labelName')).toBeVisible();
    await expect(dashboard.page.locator('#labelColor')).toBeVisible();
    await expect(dashboard.page.getByTestId('submit-label-button')).toBeVisible();
    await expect(dashboard.page.getByTestId('cancel-label-button')).toBeVisible();

    // Click cancel button
    await dashboard.page.getByTestId('cancel-label-button').click();

    // Form should be hidden again
    await expect(dashboard.page.getByTestId('create-label-form')).not.toBeVisible();
  });

  test('should have proper form structure for create label', async () => {
    // Login as user
    await dashboard.login(users[UserRole.USER]);
    await dashboard.shouldBeVisible();

    // Open create label form
    await dashboard.page.getByTestId('create-label-button').click();
    await expect(dashboard.page.getByTestId('create-label-form')).toBeVisible();

    // Check form title
    await expect(dashboard.page.getByTestId('create-label-form')).toContainText('Create New Label');

    // Check label name input
    const labelNameInput = dashboard.page.locator('#labelName');
    await expect(labelNameInput).toBeVisible();
    await expect(labelNameInput).toHaveAttribute('placeholder', 'Enter label name');
    await expect(labelNameInput).toHaveAttribute('type', 'text');

    // Check color picker
    const colorInput = dashboard.page.locator('#labelColor');
    await expect(colorInput).toBeVisible();
    await expect(colorInput).toHaveAttribute('type', 'color');
    
    // Should have default color value
    const colorValue = await colorInput.inputValue();
    expect(colorValue).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
  });

  test('should display labels column in items table when folders exist', async () => {
    // Login as user
    await dashboard.login(users[UserRole.USER]);
    await dashboard.shouldBeVisible();

    // If there are folders with items, check that the labels column is present
    const itemsTable = dashboard.page.getByTestId('items-table');
    const labelsHeader = itemsTable.locator('th').filter({ hasText: 'Labels' });
    
    // The column should exist (though it might not be visible if no folders/items exist)
    const isTableVisible = await itemsTable.isVisible();
    if (isTableVisible) {
      await expect(labelsHeader).toBeVisible();
    }
  });

  test('should validate proper button order in action bar', async () => {
    // Login as user
    await dashboard.login(users[UserRole.USER]);
    await dashboard.shouldBeVisible();

    // Get all action buttons
    const createFolderButton = dashboard.page.getByTestId('create-folder-button');
    const createLabelButton = dashboard.page.getByTestId('create-label-button');
    const createItemButton = dashboard.page.getByTestId('create-item-button');

    // All buttons should be visible
    await expect(createFolderButton).toBeVisible();
    await expect(createLabelButton).toBeVisible();
    await expect(createItemButton).toBeVisible();

    // Verify button order by checking their positions
    const buttonContainer = createFolderButton.locator('..'); // Parent container
    const buttons = buttonContainer.locator('button[data-testid]');
    
    // Check that buttons appear in correct order
    await expect(buttons.nth(0)).toHaveAttribute('data-testid', 'create-folder-button');
    await expect(buttons.nth(1)).toHaveAttribute('data-testid', 'create-item-button');
    await expect(buttons.nth(2)).toHaveAttribute('data-testid', 'create-label-button');
  });
});