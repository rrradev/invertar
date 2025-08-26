import { test, expect } from '../../fixtures/admin.fixture';
import { faker } from '@faker-js/faker';
import { parsedEnv } from '../../../utils/envSchema';

const testUsername = faker.internet.username() + Date.now();
const testUsername2 = faker.internet.username() + Date.now();

test.describe('Admin User Management', () => {
  test('should display users page with correct elements', async ({ usersPage }) => {
    // Verify page title and header elements
    await expect(usersPage.welcomeMessage).toBeVisible();
    await expect(usersPage.signOutButton).toBeVisible();
    await expect(usersPage.createUserButton).toBeVisible();
    await expect(usersPage.usersTable).toBeVisible();

    // Verify users table is loaded
    await usersPage.waitForUsersTableToLoad();
  });

  test('should create a new user successfully', async ({ usersPage }) => {
    // Get initial count of users
    const initialCount = await usersPage.getUsersTableRowCount();

    // Create new user
    await usersPage.createUser(testUsername);

    // Verify success message is shown with OTAC
    await expect(usersPage.successAlert).toBeVisible();
    const successMessage = await usersPage.successAlert.textContent();
    expect(successMessage).toContain(`User ${testUsername} created successfully!`);
    expect(successMessage).toContain('Access code:');

    // Verify user appears in the table
    await expect(usersPage.page.locator(`tr:has-text("${testUsername}")`)).toBeVisible();

    // Verify user data in table
    const userData = await usersPage.getUserRowData(testUsername);
    expect(userData.username).toContain(testUsername);
    expect(userData.status).toContain('Pending Setup'); // New user should have this status
    expect(userData.otac).toBeDefined(); // Should have OTAC displayed
  });

  test('should not create user with duplicate username', async ({ usersPage }) => {
    // Try to create user with same username as previous test
    await usersPage.createUser(parsedEnv.USER_USERNAME);

    // Verify error message is shown
    await expect(usersPage.errorAlert).toBeVisible();
    const errorMessage = await usersPage.errorAlert.textContent();
    expect(errorMessage).toContain('Username already exists in this organization');
  });

  test('should cancel user creation', async ({ usersPage }) => {
    // Start creating user but cancel
    await usersPage.createUserButton.click();
    await usersPage.usernameInput.fill('cancelled-user');
    await usersPage.cancelButton.click();

    // Verify form is closed and no user was created
    await expect(usersPage.usernameInput).not.toBeVisible();
    expect(await usersPage.isUserInTable('cancelled-user')).toBe(false);
  });

  test('should reset user OTAC successfully', async ({ usersPage }) => {
    // Create a user first
    await usersPage.createUser(testUsername2);
    await expect(usersPage.successAlert).toBeVisible();

    // Get initial OTAC
    const initialUserData = await usersPage.getUserRowData(testUsername2);
    const initialOTAC = initialUserData.otac;

    // Reset the user
    await usersPage.resetUser(testUsername2);

    // Verify success message is shown with new OTAC
    await expect(usersPage.successAlert).toBeVisible();
    const successMessage = await usersPage.successAlert.textContent();
    expect(successMessage).toContain(`User ${testUsername2} reset successfully!`);
    expect(successMessage).toContain('Access code:');

    // Verify OTAC changed in the table
    const updatedUserData = await usersPage.getUserRowData(testUsername2);
    expect(updatedUserData.otac).not.toBe(initialOTAC);
    expect(updatedUserData.status).toContain('Pending Setup'); // Status should be reset
  });

  test('should delete user successfully', async ({ usersPage }) => {
    // Get first user in table
    const userToDelete = await usersPage.getFirstUsernameInTable();
    // Delete the user
    await usersPage.deleteUser(userToDelete);

    // Verify success message
    await expect(usersPage.successAlert).toBeVisible();
    const successMessage = await usersPage.successAlert.textContent();
    expect(successMessage).toContain(`User ${userToDelete} deleted successfully`);

    // Verify user no longer appears in table
    expect(await usersPage.isUserInTable(userToDelete)).toBe(false);
  });

  test('should handle table interactions correctly', async ({ usersPage }) => {
    // Verify table headers are present and correctly ordered
    const headers = usersPage.usersTable.locator('thead th');
    await expect(headers.nth(0)).toContainText('User');
    await expect(headers.nth(1)).toContainText('Created');
    await expect(headers.nth(2)).toContainText('OTAC');
    await expect(headers.nth(3)).toContainText('Status');
    await expect(headers.nth(4)).toContainText('Actions');
  });

});