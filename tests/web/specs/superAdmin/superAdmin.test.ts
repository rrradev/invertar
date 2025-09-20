import Admins from 'tests/web/pages/admins.page';
import { test } from '../../fixtures/superAdmin.fixture';
import Login from '../../pages/login.page';

test('login and reload dashboard page', { tag: '@smoke' }, async ({ dashboard }) => {
  await dashboard.page.reload();
  await dashboard.page.waitForTimeout(1000);

  await dashboard.shouldBeVisible();
});

test('signout flow', { tag: '@smoke' }, async ({ dashboard }) => {
  await dashboard.header.clickSignOut();
  const login = new Login(dashboard.page);

  await login.shouldBeVisible();
});

test('access token is refreshed automatically on reload', { tag: '@smoke' }, async ({ dashboard }) => {
  await dashboard.expireCookie('accessToken');
  await dashboard.page.reload();

  await dashboard.shouldBeVisible();
});

test('user is redirected to /login on reload after refresh token expires', { tag: '@smoke' }, async ({ dashboard }) => {
  await dashboard.expireCookie('accessToken');
  await dashboard.expireCookie('refreshToken');

  await dashboard.page.reload();

  await new Login(dashboard.page).shouldBeVisible();
});

test('access token is refreshed automatically on redirect', { tag: '@smoke' }, async ({ dashboard }) => {
  await dashboard.expireCookie('accessToken');
  await dashboard.header.userManagementButton.click();

  await new Admins(dashboard.page).shouldBeVisible();
});

test('user is redirected to /login on redirect after refresh token expires', { tag: '@smoke' }, async ({ dashboard }) => {
  await dashboard.expireCookie('accessToken');
  await dashboard.expireCookie('refreshToken');

  await dashboard.header.userManagementButton.click();

  await new Login(dashboard.page).shouldBeVisible();
});