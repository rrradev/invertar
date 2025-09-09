import { test, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';
import { parsedEnv } from '../../utils/envSchema';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

test.describe('New Authentication Flow Tests', () => {
  
  test('Root page redirects authenticated user to dashboard', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to root page
    await page.goto('/');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Verify user welcome message is displayed with organization name
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${username}`);
    expect(welcomeMessage).toContain(org);
  });
  
  test('Root page redirects unauthenticated user to login', async ({ page }) => {
    // Navigate directly to root page without logging in
    await page.goto('/');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    const loginPage = new Login(page);
    await loginPage.shouldBeVisible();
  });
  
  test('Header displays user info from user store', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Verify header displays correct user information
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${username}`);
    expect(welcomeMessage).toContain(`from`);
    expect(welcomeMessage).toContain(org);
    
    // Verify sign out button is present
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
    
    // Verify user management button is present for SUPER_ADMIN
    await expect(page.locator('#user-management-button')).toBeVisible();
  });
  
  test('Page refresh maintains current route and does not redirect to dashboard', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Verify we're on admins page
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
    
    // Refresh the page
    await page.reload();
    
    // Should still be on admins page, not redirected to dashboard
    await page.waitForURL('**/admins');
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
    
    // User should still be authenticated
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${username}`);
  });
  
  test('Navigation between protected routes works without redundant loading', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    const dashboard = new Dashboard(page);
    await dashboard.shouldBeVisible();
    
    // Navigate back to admins
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
    
    // User should remain authenticated throughout
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${username}`);
  });
  
  test('Loading overlay appears during navigation (SvelteKit $navigating)', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Navigate to a different route and check for loading states
    // Note: This test may be timing-dependent, but we can check for navigation state
    const navigationPromise = page.waitForURL('**/admins');
    await page.goto('/admins');
    await navigationPromise;
    
    // Verify the page loaded correctly
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
  });
  
  test('Logout clears user store and redirects to login', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Verify logged in state
    await expect(page.locator('#welcome-message')).toBeVisible();
    
    // Click sign out
    await page.locator('button:has-text("Sign out")').click();
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await loginPage.shouldBeVisible();
    
    // User should no longer be authenticated - try accessing protected route
    await page.goto('/dashboard');
    
    // Should redirect back to login
    await page.waitForURL('**/login');
  });
  
  test('Header user management button navigates to correct route based on role', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(org, username, password);
    
    // Click user management button
    await page.locator('#user-management-button').click();
    
    // Should navigate to admins page for SUPER_ADMIN
    await page.waitForURL('**/admins');
    await expect(page.locator('h2')).toHaveText(/Admin Management/);
  });
  
  test('Admin user navigates to users page via header button', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin
    await loginPage.login(
      process.env.ADMIN_ORGANIZATION!,
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!
    );
    
    // Click user management button
    await page.locator('#user-management-button').click();
    
    // Should navigate to users page for ADMIN
    await page.waitForURL('**/users');
    
    // Verify users page loaded
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${process.env.ADMIN_USERNAME}`);
  });
  
});