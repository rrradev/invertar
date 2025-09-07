import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

type MyFixtures = {
    dashboard: Dashboard;
};

export const test = base.extend<MyFixtures>({
    dashboard  : async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        const dashboard = await loginPage.login(org, username, password);

        await expect(dashboard.welcomeMessage).toHaveText(`Welcome, ${username}`);
        await dashboard.shouldBeVisible();
        await use(dashboard);
    },
});

export { expect };

