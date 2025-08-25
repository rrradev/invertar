import { test } from '../../fixtures/superAdmin.fixture';
import Login from '../../pages/login.page';

test('login and reload dashboard', async ({ dashboard }) => {
  await dashboard.page.reload();
  await dashboard.page.waitForTimeout(1000);

  await dashboard.shouldBeVisible();
});

test('signout flow', async ({ dashboard }) => {
  const login = await dashboard.signOut();

  await login.shouldBeVisible();
});

test('access token is refreshed automatically', async ({ dashboard }) => {
  await dashboard.expireCookie('accessToken');
  await dashboard.page.reload();
  await dashboard.page.waitForTimeout(1000);

  await dashboard.shouldBeVisible();
});

test('user is redirected to /login after refresh token expires', async ({ dashboard }) => {
  await dashboard.expireCookie('accessToken');
  await dashboard.expireCookie('refreshToken');

  await dashboard.page.reload();
  await dashboard.page.waitForTimeout(1000);

  await new Login(dashboard.page).shouldBeVisible();
});