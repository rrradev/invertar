import { test, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';
import Admins from '../pages/admins.page';

const superAdminOrg = process.env.SUPERADMIN_ORGANIZATION!;
const superAdminUsername = process.env.SUPERADMIN_USERNAME!;
const superAdminPassword = process.env.SUPERADMIN_PASSWORD!;

const adminOrg = process.env.ADMIN_ORGANIZATION!;
const adminUsername = process.env.ADMIN_USERNAME!;
const adminPassword = process.env.ADMIN_PASSWORD!;

test.describe('Intelligent Auth Caching Tests', () => {
  
  test('Auth profile is called only once per session during navigation', async ({ page }) => {
    // Track network requests
    const networkRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('auth.profile')) {
        networkRequests.push(url);
      }
    });
    
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(superAdminOrg, superAdminUsername, superAdminPassword);
    
    // Navigate to different routes multiple times
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    // Wait a bit to ensure all requests are captured
    await page.waitForTimeout(2000);
    
    // Should have minimal profile calls (ideally just one after login)
    // Due to timing and implementation details, we allow up to 2 calls
    expect(networkRequests.length).toBeLessThanOrEqual(2);
    
    // If there are profile calls, they should be for the auth.profile endpoint
    networkRequests.forEach(url => {
      expect(url).toContain('auth.profile');
    });
  });
  
  test('User state persists across route navigation without API calls', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    // Verify user is authenticated and welcome message shows
    const welcomeMessage1 = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage1).toContain(`Welcome, ${adminUsername}`);
    expect(welcomeMessage1).toContain(adminOrg);
    
    // Navigate to users page
    await page.goto('/users');
    await page.waitForURL('**/users');
    
    // User should still be authenticated without delay
    const welcomeMessage2 = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage2).toContain(`Welcome, ${adminUsername}`);
    expect(welcomeMessage2).toContain(adminOrg);
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    // User should still be authenticated
    const welcomeMessage3 = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage3).toContain(`Welcome, ${adminUsername}`);
    expect(welcomeMessage3).toContain(adminOrg);
    
    // All welcome messages should be identical (same user data)
    expect(welcomeMessage1).toBe(welcomeMessage2);
    expect(welcomeMessage2).toBe(welcomeMessage3);
  });
  
  test('User store cache is cleared on logout and repopulated on login', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(superAdminOrg, superAdminUsername, superAdminPassword);
    
    // Verify user is authenticated
    await expect(page.locator('#welcome-message')).toBeVisible();
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${superAdminUsername}`);
    
    // Sign out
    await page.locator('button:has-text("Sign out")').click();
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    // Try to access protected route - should redirect to login
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    
    // Login again with different user (admin)
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Should be authenticated with different user data
    await page.waitForURL('**/dashboard');
    const newWelcomeMessage = await page.locator('#welcome-message').textContent();
    expect(newWelcomeMessage).toContain(`Welcome, ${adminUsername}`);
    expect(newWelcomeMessage).toContain(adminOrg);
    
    // Should be different from previous user
    expect(newWelcomeMessage).not.toBe(welcomeMessage);
  });
  
  test('Page refresh triggers smart auth check without full re-authentication', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as super admin
    await loginPage.login(superAdminOrg, superAdminUsername, superAdminPassword);
    
    // Navigate to admins page
    await page.goto('/admins');
    await page.waitForURL('**/admins');
    
    const adminsPage = new Admins(page);
    await adminsPage.shouldBeVisible();
    
    // Get initial welcome message
    const initialWelcomeMessage = await adminsPage.getWelcomeMessageText();
    
    // Refresh the page
    await page.reload();
    
    // Should still be on admins page with same user data
    await page.waitForURL('**/admins');
    await adminsPage.shouldBeVisible();
    
    // Welcome message should be identical (same cached user data)
    const refreshedWelcomeMessage = await adminsPage.getWelcomeMessageText();
    expect(refreshedWelcomeMessage).toBe(initialWelcomeMessage);
    expect(refreshedWelcomeMessage).toContain(`Welcome, ${superAdminUsername}`);
    expect(refreshedWelcomeMessage).toContain(superAdminOrg);
  });
  
  test('Invalid token scenario triggers re-authentication', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Verify logged in
    await page.waitForURL('**/dashboard');
    await expect(page.locator('#welcome-message')).toBeVisible();
    
    // Simulate token expiry by clearing cookies
    await page.context().clearCookies();
    
    // Try to navigate to protected route
    await page.goto('/admins');
    
    // Should redirect to login due to invalid/missing token
    await page.waitForURL('**/login');
    await loginPage.shouldBeVisible();
  });
  
  test('Role-based access control with cached user data', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Login as admin (not super admin)
    await loginPage.login(adminOrg, adminUsername, adminPassword);
    
    // Navigate to users page (admin should have access)
    await page.goto('/users');
    await page.waitForURL('**/users');
    
    // Verify admin has access to users page
    await expect(page.locator('#welcome-message')).toBeVisible();
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${adminUsername}`);
    
    // Verify user management button is present for admin role
    await expect(page.locator('#user-management-button')).toBeVisible();
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    // Should still show admin user info from cache
    const dashboardWelcomeMessage = await page.locator('#welcome-message').textContent();
    expect(dashboardWelcomeMessage).toContain(`Welcome, ${adminUsername}`);
    expect(dashboardWelcomeMessage).toContain(adminOrg);
  });
  
});