import { test, expect } from '@playwright/test';
import Login from '../../pages/login.page';
import Admins from '../../pages/admins.page';

const superAdminOrg = process.env.SUPERADMIN_ORGANIZATION!;
const superAdminUsername = process.env.SUPERADMIN_USERNAME!;
const superAdminPassword = process.env.SUPERADMIN_PASSWORD!;

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
    const dashboard = await loginPage.loginAs(superAdminOrg, superAdminUsername, superAdminPassword);
    await dashboard.shouldBeVisible();

    // Navigate to different routes multiple times
    await dashboard.usersManagementButton.click();
    const admins = new Admins(page);
    await admins.shouldBeVisible();

    await admins.page.goBack();
    await dashboard.shouldBeVisible();

    await dashboard.page.goForward();
    await admins.shouldBeVisible();

    // Wait a bit to ensure all requests are captured
    await page.waitForTimeout(2000);

    // Should have minimal profile calls (ideally just one after login)
    expect(networkRequests.length).toBe(1);

    // If there are profile calls, they should be for the auth.profile endpoint
    networkRequests.forEach(url => {
      expect(url).toContain('auth.profile');
    });
  });

});