import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Admins from '../pages/admins.page';

const org = process.env.SUPERADMIN_ORGANIZATION!;
const username = process.env.SUPERADMIN_USERNAME!;
const password = process.env.SUPERADMIN_PASSWORD!;

type MyFixtures = {
    admins: Admins;
};

export const test = base.extend<MyFixtures>({
    admins: async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        const admins = await loginPage.login(org, username, password);

        await expect(admins.welcomeMessage).toHaveText(`Welcome, ${username}`);

        await use(admins);
    },
});

export { expect };

