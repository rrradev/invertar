import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Users from '../pages/users.page';
import Dashboard from '../pages/dashboard.page';

const org = process.env.ADMIN_ORGANIZATION!;
const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;

type MyFixtures = {
    users: Users;
    dashboard: Dashboard;
};

export const test = base.extend<MyFixtures>({
    dashboard: async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        const dashboard = await loginPage.loginAs(org, username, password);
        await dashboard.shouldBeVisible();
        await use(dashboard);
    },
    users: async ({ dashboard }, use) => {
        await dashboard.header.userManagementButton.click();
        const users = new Users(dashboard.page);
        await users.shouldBeVisible();
        await use(users);
    },
});

export { expect };