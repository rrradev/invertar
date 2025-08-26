import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Users from '../pages/users.page';

const org = process.env.ADMIN_ORGANIZATION!;
const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;

type MyFixtures = {
    usersPage: Users;
};

export const test = base.extend<MyFixtures>({
    usersPage: async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        
        // Login as admin
        await loginPage.login(org, username, password);
        
        // Navigate to users page
        await page.goto('/users');
        const usersPage = new Users(page);
        
        // Verify admin is logged in and on users page
        await expect(usersPage.welcomeMessage).toHaveText(`Welcome, ${username}`);
        await expect(page).toHaveTitle(/User Management/);

        await use(usersPage);
    },
});

export { expect };