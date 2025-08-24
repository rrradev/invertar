import { test, expect } from '@playwright/test';
import LoginPage from '../../pages/login.page';
import { da } from 'zod/v4/locales/index.cjs';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

test('login and reload dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  const dashboardPage = await loginPage.login(org, username, password);

  await expect(dashboardPage.welcomeMessage).toHaveText(`Welcome, ${username}`);
  await page.reload();
  await page.waitForTimeout(1000);

  await expect(dashboardPage.welcomeMessage).toHaveText(`Welcome, ${username}`);
});

test('signout flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  const dashboardPage = await loginPage.login(org, username, password);

  await expect(dashboardPage.welcomeMessage).toHaveText(`Welcome, ${username}`);
  await dashboardPage.signOutButton.click();
  
  await expect(loginPage.orgInput).toBeVisible();
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.submitButton).toBeVisible();
});

test('access token is refreshed', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  const dashboardPage = await loginPage.login(org, username, password);

  await expect(dashboardPage.welcomeMessage).toHaveText(`Welcome, ${username}`);
  await dashboardPage.deleteCookie('accessToken');
});