import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';
import Admins from '../pages/admins.page';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

type MyFixtures = {
    dashboard: Dashboard;
    admins: Admins;
};

export const test = base.extend<MyFixtures>({
    dashboard: async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        const dashboard = await loginPage.loginAs(org, username, password);

        await expect(dashboard.header.welcomeMessage).toHaveText(`Welcome, ${username} from ${org}`);
        await dashboard.shouldBeVisible();
        await use(dashboard);
    },
    admins: async ({ dashboard }, use) => {
        await dashboard.header.userManagementButton.click();
        const admins = new Admins(dashboard.page);
        await admins.shouldBeVisible();
        await use(admins);
    }
});

export { expect };

