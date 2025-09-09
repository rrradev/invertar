import { test, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Admins from '../pages/admins.page';
import { faker } from '@faker-js/faker';
import { parsedEnv } from '../../utils/envSchema';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

const testAdminUsername = faker.internet.username() + Date.now();
const testAdminEmail = faker.internet.email();
const testOrgName = faker.company.name() + Date.now();

test.describe('Route Restructuring Tests - Admins Page', () => {
  
  test('Admins route (/admins) loads with proper authentication', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate directly to admins route
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    const adminsPage = new Admins(page);
    await adminsPage.shouldBeVisible();
    
    // Verify page title and content
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
    await expect(page.locator('p')).toContainText('Manage administrators in your app');
    
    // Verify welcome message shows user from user store
    const welcomeMessage = await adminsPage.getWelcomeMessageText();
    expect(welcomeMessage).toContain(`Welcome, ${username}`);
    expect(welcomeMessage).toContain(org);
  });
  
  test('Admins page displays Create Admin button and form', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    const adminsPage = new Admins(page);
    await adminsPage.shouldBeVisible();
    
    // Verify Create Admin button is visible
    await expect(page.locator('button:has-text("Create Admin")')).toBeVisible();
    
    // Click Create Admin button
    await page.locator('button:has-text("Create Admin")').click();
    
    // Verify form appears
    await expect(page.locator('h3:has-text("Create New Admin")')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#organization')).toBeVisible();
    
    // Verify form has Cancel and Create buttons
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Admin")').last()).toBeVisible();
  });
  
  test('Create admin functionality works correctly', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Click Create Admin button
    await page.locator('button:has-text("Create Admin")').click();
    
    // Fill in the form
    await page.locator('#username').fill(testAdminUsername);
    await page.locator('#email').fill(testAdminEmail);
    await page.locator('#organization').fill(testOrgName);
    
    // Submit the form
    await page.locator('button:has-text("Create Admin")').last().click();
    
    // Wait for success message
    await expect(page.locator('.bg-green-50')).toBeVisible();
    
    // Verify success message contains admin username and access code
    const successMessage = await page.locator('.bg-green-50').textContent();
    expect(successMessage).toContain(`Admin ${testAdminUsername} created successfully!`);
    expect(successMessage).toContain('Access code:');
    
    // Verify admin appears in the table
    await expect(page.locator(`tr:has-text("${testAdminUsername}")`)).toBeVisible();
    await expect(page.locator(`tr:has-text("${testAdminEmail}")`)).toBeVisible();
    await expect(page.locator(`tr:has-text("${testOrgName}")`)).toBeVisible();
  });
  
  test('Admins table displays correct headers and data', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Verify table headers
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const headers = table.locator('thead th');
    await expect(headers.nth(0)).toContainText('Administrator');
    await expect(headers.nth(1)).toContainText('Email');
    await expect(headers.nth(2)).toContainText('Organization');
    await expect(headers.nth(3)).toContainText('Created');
    await expect(headers.nth(4)).toContainText('OTAC');
    await expect(headers.nth(5)).toContainText('Status');
    await expect(headers.nth(6)).toContainText('Actions');
  });
  
  test('Admin actions dropdown works correctly', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Look for an admin row with actions button
    const adminRows = page.locator('tbody tr');
    const rowCount = await adminRows.count();
    
    if (rowCount > 0) {
      // Click on the first admin's actions button (three dots)
      const firstRowActionsButton = adminRows.first().locator('button[aria-haspopup="true"]');
      await firstRowActionsButton.click();
      
      // Verify dropdown menu appears with correct options
      await expect(page.locator('button:has-text("Delete Admin")')).toBeVisible();
      await expect(page.locator('button:has-text("Refresh OTAC")')).toBeVisible();
      await expect(page.locator('button:has-text("Reset Admin")')).toBeVisible();
      
      // Close dropdown by clicking outside
      await page.locator('body').click({ position: { x: 0, y: 0 } });
      
      // Verify dropdown is closed
      await expect(page.locator('button:has-text("Delete Admin")')).not.toBeVisible();
    }
  });
  
  test('Admins page handles error states correctly', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Try to create admin with missing fields
    await page.locator('button:has-text("Create Admin")').click();
    
    // Submit form without filling required fields
    await page.locator('button:has-text("Create Admin")').last().click();
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toBeVisible();
    const errorMessage = await page.locator('.bg-red-50').textContent();
    expect(errorMessage).toContain('All fields are required');
  });
  
  test('Form cancel functionality works correctly', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Click Create Admin button
    await page.locator('button:has-text("Create Admin")').click();
    
    // Verify form is visible
    await expect(page.locator('#username')).toBeVisible();
    
    // Fill some fields
    await page.locator('#username').fill('test-user');
    
    // Click Cancel
    await page.locator('button:has-text("Cancel")').click();
    
    // Verify form is hidden
    await expect(page.locator('#username')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Create New Admin")')).not.toBeVisible();
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