import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';
import { faker } from '@faker-js/faker';
import Folder from '../pages/components/dashboard/folder.component';
import { getToken } from '../../api/e2e/config/config';
import { UserRole } from '@repo/types/users';

const org = process.env.ADMIN_ORGANIZATION!;
const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;

type MyFixtures = {
    dashboard: Dashboard;
    folder: Folder;
    randomItemName: string;
    accessToken: string;
};

export const test = base.extend<MyFixtures>({
    // Fixture: login with the new admin
    dashboard: async ({ page }, use) => {
        const loginPage = new Login(page);
        await loginPage.open();
        const dashboard = await loginPage.loginAs(
            org,
            username,
            password
        );
        await dashboard.shouldBeVisible();
        await use(dashboard);
    },

    folder: async ({ dashboard }, use) => {
        // Create a folder for item tests
        const testFolderName = faker.commerce.department() + '-items-' + Date.now();
        await dashboard.createFolder(testFolderName);
        await dashboard.waitForSuccessMessage();
        await dashboard.waitForFoldersToLoad();
        const folder = await dashboard.getFolderByName(testFolderName);
        await use(folder);
    },

    randomItemName: async ({ }, use) => {
        const itemName = faker.commerce.productName() + '-' + Date.now();
        await use(itemName);
    },

    accessToken: async ({ }, use) => {
        const token = await getToken(UserRole.USER);
        await use(token);
    }
});

export { expect };
