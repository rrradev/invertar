import { test } from '../../fixtures/superAdmin.fixture';
import Login from '../../pages/login.page';

test('login and reload admins page @smoke', async ({ admins }) => {
  await admins.page.reload();
  await admins.page.waitForTimeout(1000);

  await admins.shouldBeVisible();
});

test('signout flow @smoke', async ({ admins }) => {
  const login = await admins.signOut();

  await login.shouldBeVisible();
});

test('access token is refreshed automatically @smoke', async ({ admins }) => {
  await admins.expireCookie('accessToken');
  await admins.page.reload();
  await admins.page.waitForTimeout(1000);

  await admins.shouldBeVisible();
});

test('user is redirected to /login after refresh token expires @smoke', async ({ admins }) => {
  await admins.expireCookie('accessToken');
  await admins.expireCookie('refreshToken');

  await admins.page.reload();
  await admins.page.waitForTimeout(1000);

  await new Login(admins.page).shouldBeVisible();
});