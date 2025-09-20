import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';
import { req, getToken } from '../../api/e2e/config/config';
import { faker } from '@faker-js/faker';
import { UserRole } from '@repo/types/users';

type MyFixtures = {
  newAdminCreds: { username: string; password: string; organizationName: string };
  dashboard: Dashboard;
};

export const test = base.extend<MyFixtures>({
  // Fixture: create an admin via API and set password
  newAdminCreds: async ({ }, use) => {
    const username = faker.internet.username().toLowerCase().concat(Date.now().toString());
    const email = username + '@example.com';
    const organizationName = faker.company.name().concat(Date.now().toString());
    const password = faker.internet.password({ length: 12 }) + '1@A'; // ensure it meets complexity
    const superAdminToken = await getToken(UserRole.SUPER_ADMIN);
    // 1. Create admin
    const createAdminInput = { username, email, organizationName };
    const createAdminRes = await req<any>(
      'POST',
      'superAdmin.createAdmin',
      createAdminInput,
      superAdminToken
    );

    // 2. Set password with one-time access code
    const setPasswordInput = {
      userId: createAdminRes.userId,
      newPassword: password,
      oneTimeAccessCode: createAdminRes.oneTimeAccessCode,
    };

    await req<any>('POST', 'auth.setPasswordWithCode', setPasswordInput);

    await use({ username, password, organizationName });
  },

  // Fixture: login with the new admin
  dashboard: async ({ page, newAdminCreds }, use) => {
    const loginPage = new Login(page);
    await loginPage.open();
    const dashboard = await loginPage.loginAs(
      newAdminCreds.organizationName,
      newAdminCreds.username,
      newAdminCreds.password
    );
    await dashboard.shouldBeVisible();
    await use(dashboard);
  },
});

export { expect };
