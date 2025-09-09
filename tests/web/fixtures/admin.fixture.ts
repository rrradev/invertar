import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Users from '../pages/users.page';
import usersPage from '../pages/users.page';

const org = process.env.ADMIN_ORGANIZATION!;
const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;

type MyFixtures = {
    users: Users;
};

export const test = base.extend<MyFixtures>({
    users: async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        
        // Login as admin
        await loginPage.loginAs(org, username, password);

        // Navigate to users page
        await page.waitForTimeout(2000);
        await page.goto('/users');
        const users = new Users(page);
        
        // Verify admin is logged in and on users page
        await expect(users.welcomeMessage).toHaveText(`Welcome, ${username} from ${org}`);
        await users.shouldBeVisible();

        await use(users);
    },
});

export { expect };