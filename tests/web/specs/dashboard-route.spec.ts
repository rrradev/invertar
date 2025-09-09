import { test, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';

const userOrg = process.env.USER_ORGANIZATION!;
const userUsername = process.env.USER_USERNAME!;
const userPassword = process.env.USER_PASSWORD!;

const adminOrg = process.env.ADMIN_ORGANIZATION!;
const adminUsername = process.env.ADMIN_USERNAME!;
const adminPassword = process.env.ADMIN_PASSWORD!;

test.describe('Dashboard Route Tests After Restructuring', () => {
  
  test('Dashboard route (/dashboard) loads correctly for USER role', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as user
    await loginPage.login(userOrg, userUsername, userPassword);
    
    // Should be on dashboard after login
    await page.waitForURL('**/dashboard');
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Verify welcome message shows user from user store
    const welcomeMessage = await dashboard.welcomeMessage.textContent();
    expect(welcomeMessage).toContain(`Welcome, ${userUsername}`);
    expect(welcomeMessage).toContain(userOrg);
  });
  
  test('Dashboard route loads correctly for ADMIN role', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Verify welcome message shows admin from user store
    const welcomeMessage = await dashboard.welcomeMessage.textContent();
    expect(welcomeMessage).toContain(`Welcome, ${adminUsername}`);
    expect(welcomeMessage).toContain(adminOrg);
  });
  
  test('Dashboard functionality remains intact after restructuring', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as user
    await loginPage.login(userOrg, userUsername, userPassword);
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Verify core dashboard functionality still works
    await expect(dashboard.createFolderButton).toBeVisible();
    await expect(dashboard.createItemButton).toBeVisible();
    await expect(dashboard.foldersContainer).toBeVisible();
    
    // Verify sign out functionality still works
    await expect(dashboard.signOutButton).toBeVisible();
  });
  
  test('Dashboard page refresh maintains route and authentication', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as user
    await loginPage.login(userOrg, userUsername, userPassword);
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still be on dashboard
    await page.waitForURL('**/dashboard');
    await dashboard.shouldBeVisible();
    
    // User should still be authenticated
    const welcomeMessage = await dashboard.welcomeMessage.textContent();
    expect(welcomeMessage).toContain(`Welcome, ${userUsername}`);
  });
  
  test('Unauthenticated access to /dashboard redirects to login', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    const loginPage = new Login(page);
    await loginPage.shouldBeVisible();
  });
  
  test('Header shows appropriate buttons for USER role on dashboard', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as user
    await loginPage.login(userOrg, userUsername, userPassword);
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // USER role should NOT have user management button
    await expect(page.locator('#user-management-button')).not.toBeVisible();
    
    // But should have welcome message and sign out
    await expect(page.locator('#welcome-message')).toBeVisible();
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
  });
  
  test('Header shows appropriate buttons for ADMIN role on dashboard', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // ADMIN role should have user management button
    await expect(page.locator('#user-management-button')).toBeVisible();
    
    // And should have welcome message and sign out
    await expect(page.locator('#welcome-message')).toBeVisible();
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
  });
  
  test('Sign out from dashboard works correctly', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as user
    await loginPage.login(userOrg, userUsername, userPassword);
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Sign out
    await dashboard.signOut();
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await loginPage.shouldBeVisible();
  });
  
  test('Navigation from dashboard to other routes works', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin (has access to users page)
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Click user management button to navigate to users
    await page.locator('#user-management-button').click();
    
    // Should navigate to users page
    await page.waitForURL('**/users');
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    await dashboard.shouldBeVisible();
    
    // User should remain authenticated throughout
    const welcomeMessage = await dashboard.welcomeMessage.textContent();
    expect(welcomeMessage).toContain(`Welcome, ${adminUsername}`);
  });
  
});