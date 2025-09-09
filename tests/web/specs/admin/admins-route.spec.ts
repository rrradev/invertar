import { expect, test } from '../../fixtures/superAdmin.fixture';;
import Login from '../../pages/login.page';
import { faker } from '@faker-js/faker';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

const testAdminUsername = faker.internet.username() + Date.now();
const testAdminEmail = faker.internet.email();
const testOrgName = faker.company.name() + Date.now();

test.describe('Admins Page', () => {
    
  test('Admins page displays Create Admin button and form', async ({ admins }) => {     
    // Click Create Admin button
    await admins.createAdminButton.click();

    // Verify the admin form is visible
    await admins.adminsFormShouldBeVisible();
  });
  
  test('Create admin functionality works correctly', async ({ admins }) => {
  // Click Create Admin button
    await admins.createAdminButton.click();

    // Fill in the form
    await admins.usernameField.fill(testAdminUsername);
    await admins.emailField.fill(testAdminEmail);
    await admins.organizationField.fill(testOrgName);

    // Submit the form
    await admins.createAdminFormButton.click();
        
    // Verify success message contains admin username and access code
    const successMessage = await admins.successMessage.getMessageText();
    expect(successMessage).toContain(`Admin ${testAdminUsername} created successfully!`);
    expect(successMessage).toContain('Access code:');
    
    // Verify admin appears in the table
    await admins.shouldHaveTextInTable(testAdminUsername);
    await admins.shouldHaveTextInTable(testAdminEmail);
    await admins.shouldHaveTextInTable(testOrgName);
  });
  
  test('Admins table displays correct headers and data', async ({ admins }) => {
    await admins.tableShouldBeVisible(); 
  });
  
  test('Admin actions dropdown works correctly', async ({ admins }) => {    
    // Look for an admin row with actions button
    await admins.clickFirstActionsButton();
    await admins.dropdownMenuShouldBeVisible();

    // Click outside to close the dropdown
    await admins.page.locator('body').click({ position: { x: 0, y: 0 } });
    
    await admins.dropdownMenuShouldNotBeVisible();
  });
  
  test('Admins page handles error states correctly', async ({ admins }) => {
    
    // Try to create admin with missing fields
    await admins.createAdminButton.click();

    // Submit form without filling required fields
    await admins.createAdminFormButton.click();

    // Should show error message
    await expect(admins.errorMessage.container).toBeVisible();
    const errorMessage = await admins.errorMessage.getMessageText();
    expect(errorMessage).toContain('All fields are required');
  });
  
  test('Form cancel functionality works correctly', async ({ admins }) => {   
    // Click Create Admin button
    await admins.createAdminButton.click();

    // Verify form is visible
    await expect(admins.usernameField).toBeVisible();

    // Fill some fields
    await admins.usernameField.fill('test-user');
    await admins.emailField.fill('test-user@example.com');
    // Click Cancel
    await admins.cancelFormButton.click();

    // Verify form is hidden
    await expect(admins.usernameField).not.toBeVisible();
    await expect(admins.createAdminFormTitle).not.toBeVisible();
  });
  
  test('Unauthenticated access to /admins redirects to login', async ({ page }) => {
    // Try to access admins page without logging in
    await page.goto('/admins');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    const loginPage = new Login(page);
    await loginPage.shouldBeVisible();
  });
  
});