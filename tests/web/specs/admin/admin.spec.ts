import { test, expect } from '../../fixtures/admin.fixture';
import { faker } from '@faker-js/faker';
import { parsedEnv } from '../../../utils/envSchema';

const testUsername = faker.internet.username() + Date.now();
const testUsername2 = faker.internet.username() + Date.now();

test.describe('Admin User Management', () => {
  test('should display users page with correct elements', async ({ users }) => {
    // Verify page title and header elements
    await expect(users.welcomeMessage).toBeVisible();
    await expect(users.signOutButton).toBeVisible();
    await expect(users.createUserButton).toBeVisible();
    await expect(users.usersTable).toBeVisible();

    // Verify users table is loaded
    await users.waitForUsersTableToLoad();
  });

  test('should create a new user successfully', { tag: '@smoke' }, async ({ users }) => {
    // Get initial count of users
    const initialCount = await users.getUsersTableRowCount();

    // Create new user
    await users.createUser(testUsername);

    // Verify success message is shown with OTAC
    await expect(users.successAlert).toBeVisible();
    const successMessage = await users.successAlert.textContent();
    expect(successMessage).toContain(`User ${testUsername} created successfully!`);
    expect(successMessage).toContain('Access code:');

    // Verify user appears in the table
    await expect(users.page.locator(`tr:has-text("${testUsername}")`)).toBeVisible();

    // Verify user data in table
    const userData = await users.getUserRowData(testUsername);
    expect(userData.username).toContain(testUsername);
    expect(userData.status).toContain('Pending Setup'); // New user should have this status
    expect(userData.otac).toBeDefined(); // Should have OTAC displayed
  });

  test('should not create user with duplicate username', async ({ users }) => {
    // Try to create user with same username as previous test
    await users.createUser(parsedEnv.USER_USERNAME);

    // Verify error message is shown
    await expect(users.errorAlert).toBeVisible();
    const errorMessage = await users.errorAlert.textContent();
    expect(errorMessage).toContain('Username already exists in this organization');
  });

  test('should cancel user creation', async ({ users }) => {
    // Start creating user but cancel
    await users.createUserButton.click();
    await users.usernameInput.fill('cancelled-user');
    await users.cancelButton.click();

    // Verify form is closed and no user was created
    await expect(users.usernameInput).not.toBeVisible();
    expect(await users.isUserInTable('cancelled-user')).toBe(false);
  });

  test('should reset user OTAC successfully', { tag: '@smoke' }, async ({ users }) => {
    // Create a user first
    await users.createUser(testUsername2);
    await expect(users.successAlert).toBeVisible();

    // Get initial OTAC
    const initialUserData = await users.getUserRowData(testUsername2);
    const initialOTAC = initialUserData.otac;

    // Reset the user
    await users.resetUser(testUsername2);

    // Verify success message is shown with new OTAC
    await expect(users.successAlert).toBeVisible();
    const successMessage = await users.successAlert.textContent();
    expect(successMessage).toContain(`User ${testUsername2} reset successfully!`);
    expect(successMessage).toContain('Access code:');

    // Verify OTAC changed in the table
    const updatedUserData = await users.getUserRowData(testUsername2);
    expect(updatedUserData.otac).not.toBe(initialOTAC);
    expect(updatedUserData.status).toContain('Pending Setup'); // Status should be reset
  });

  test('should delete user successfully', { tag: '@smoke' }, async ({ users }) => {
    // Get first user in table
    const userToDelete = await users.getFirstUsernameInTable();
    // Delete the user
    await users.deleteUser(userToDelete);

    // Verify success message
    await expect(users.successAlert).toBeVisible();
    const successMessage = await users.successAlert.textContent();
    expect(successMessage).toContain(`User ${userToDelete} deleted successfully`);

    // Verify user no longer appears in table
    expect(await users.isUserInTable(userToDelete)).toBe(false);
  });

  test('should handle table interactions correctly', async ({ users }) => {
    // Verify table headers are present and correctly ordered
    const headers = users.usersTable.locator('thead th');
    await expect(headers.nth(0)).toContainText('User');
    await expect(headers.nth(1)).toContainText('Created');
    await expect(headers.nth(2)).toContainText('OTAC');
    await expect(headers.nth(3)).toContainText('Status');
    await expect(headers.nth(4)).toContainText('Actions');
  });

});