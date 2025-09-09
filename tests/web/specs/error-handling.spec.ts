import { test, expect } from '@playwright/test';
import Login from '../pages/login.page';

const validOrg = process.env.ADMIN_ORGANIZATION!;
const validUsername = process.env.ADMIN_USERNAME!;
const validPassword = process.env.ADMIN_PASSWORD!;

test.describe('Error Handling and Edge Cases', () => {
  
  test('Handles network errors gracefully during auth profile fetch', async ({ page }) => {
    // Login first to establish session
    const loginPage = new Login(page);
    await loginPage.open();
    await loginPage.login(validOrg, validUsername, validPassword);
    
    // Verify logged in
    await page.waitForURL('**/dashboard');
    await expect(page.locator('#welcome-message')).toBeVisible();
    
    // Simulate network failure for subsequent requests
    await page.route('**/trpc/auth.profile*', route => {
      route.abort('failed');
    });
    
    // Try to navigate to another route
    await page.goto('/users');
    
    // Should handle gracefully - either redirect to login or show error
    await page.waitForTimeout(3000);
    
    // Check if redirected to login or if error is handled gracefully
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes('/login');
    const isOnUsers = currentUrl.includes('/users');
    
    // Either should redirect to login or stay on users with cached data
    expect(isOnLogin || isOnUsers).toBe(true);
  });
  
  test('Handles malformed server responses gracefully', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Intercept auth.profile requests and return malformed response
    await page.route('**/trpc/auth.profile*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ invalid: 'response' })
      });
    });
    
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should handle gracefully by redirecting to login
    await page.waitForURL('**/login', { timeout: 10000 });
    await loginPage.shouldBeVisible();
  });
  
  test('Handles server errors (5xx) during authentication', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    
    // Intercept auth.profile requests and return 500 error
    await page.route('**/trpc/auth.profile*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Try to access a protected route
    await page.goto('/admins');
    
    // Should handle gracefully by redirecting to login
    await page.waitForURL('**/login', { timeout: 10000 });
    await loginPage.shouldBeVisible();
  });
  
  test('Handles concurrent route navigation without race conditions', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    await loginPage.login(validOrg, validUsername, validPassword);
    
    // Verify logged in
    await page.waitForURL('**/dashboard');
    
    // Rapidly navigate between routes to test for race conditions
    const navigationPromises = [
      page.goto('/users'),
      page.goto('/dashboard'),
      page.goto('/users'),
      page.goto('/dashboard')
    ];
    
    // Wait for all navigations to complete
    await Promise.all(navigationPromises);
    
    // Final state should be stable on dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('#welcome-message')).toBeVisible();
    
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${validUsername}`);
  });
  
  test('Handles browser back/forward navigation correctly', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    await loginPage.login(validOrg, validUsername, validPassword);
    
    // Navigate through several routes
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    await page.goto('/users');
    await page.waitForURL('**/users');
    
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    
    // Use browser back button
    await page.goBack();
    await page.waitForURL('**/users');
    
    // Verify user is still authenticated
    await expect(page.locator('#welcome-message')).toBeVisible();
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${validUsername}`);
    
    // Use browser forward button
    await page.goForward();
    await page.waitForURL('**/dashboard');
    
    // Verify user is still authenticated
    await expect(page.locator('#welcome-message')).toBeVisible();
  });
  
  test('Handles multiple tabs/windows correctly', async ({ context }) => {
    // Create first page/tab
    const page1 = await context.newPage();
    const loginPage = new Login(page1);
    await loginPage.open();
    await loginPage.login(validOrg, validUsername, validPassword);
    
    // Verify logged in on first tab
    await page1.waitForURL('**/dashboard');
    await expect(page1.locator('#welcome-message')).toBeVisible();
    
    // Create second page/tab
    const page2 = await context.newPage();
    
    // Navigate to protected route in second tab
    await page2.goto('/users');
    
    // Should be authenticated in second tab too (shared session)
    await page2.waitForURL('**/users');
    await expect(page2.locator('#welcome-message')).toBeVisible();
    
    const welcomeMessage1 = await page1.locator('#welcome-message').textContent();
    const welcomeMessage2 = await page2.locator('#welcome-message').textContent();
    
    // Both tabs should show same user info
    expect(welcomeMessage1).toBe(welcomeMessage2);
    expect(welcomeMessage1).toContain(`Welcome, ${validUsername}`);
  });
  
  test('Handles session timeout gracefully', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    await loginPage.login(validOrg, validUsername, validPassword);
    
    // Verify logged in
    await page.waitForURL('**/dashboard');
    await expect(page.locator('#welcome-message')).toBeVisible();
    
    // Simulate session timeout by intercepting auth requests with 401
    await page.route('**/trpc/auth.profile*', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: { 
            code: 'UNAUTHORIZED',
            message: 'Token expired' 
          } 
        })
      });
    });
    
    // Try to navigate to another route
    await page.goto('/users');
    
    // Should redirect to login due to expired session
    await page.waitForURL('**/login', { timeout: 10000 });
    await loginPage.shouldBeVisible();
  });
  
  test('Handles invalid route access attempts', async ({ page }) => {
    const loginPage = new Login(page);
    await loginPage.open();
    await loginPage.login(validOrg, validUsername, validPassword);
    
    // Try to access non-existent route
    await page.goto('/nonexistent-route');
    
    // Should handle gracefully (404 or redirect)
    await page.waitForTimeout(3000);
    
    // Verify user is still authenticated by checking a valid route
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('#welcome-message')).toBeVisible();
  });
  
  test('Handles rapid login/logout cycles', async ({ page }) => {
    const loginPage = new Login(page);
    
    // Perform multiple login/logout cycles
    for (let i = 0; i < 3; i++) {
      // Login
      await loginPage.open();
      await loginPage.login(validOrg, validUsername, validPassword);
      await page.waitForURL('**/dashboard');
      await expect(page.locator('#welcome-message')).toBeVisible();
      
      // Logout
      await page.locator('button:has-text("Sign out")').click();
      await page.waitForURL('**/login');
      await loginPage.shouldBeVisible();
    }
    
    // Final login should work normally
    await loginPage.login(validOrg, validUsername, validPassword);
    await page.waitForURL('**/dashboard');
    await expect(page.locator('#welcome-message')).toBeVisible();
    
    const welcomeMessage = await page.locator('#welcome-message').textContent();
    expect(welcomeMessage).toContain(`Welcome, ${validUsername}`);
  });
  
});