import { test as base, expect } from '@playwright/test';
import Login from '../pages/login.page';
import Dashboard from '../pages/dashboard.page';
import { faker } from '@faker-js/faker';
import Shelf from '../pages/components/dashboard/shelf.component';
import { getToken, req } from '../../api/e2e/config/config';
import { UserRole } from '@repo/types/users';

const org = process.env.USER_ORGANIZATION!;
const username = process.env.USER_USERNAME!;
const password = process.env.USER_PASSWORD!;

type MyFixtures = {
    dashboard: Dashboard;
    emptyShelf: Shelf;
    shelfWithItems: Shelf;
    randomItemName: string;
    accessToken: string;
    label1: string;
    label2: string;
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

    emptyShelf: async ({ dashboard }, use) => {
        // Create a shelf for item tests
        const testShelfName = faker.commerce.department() + '-items-' + Date.now();
        await dashboard.createShelf(testShelfName);
        await dashboard.waitForSuccessMessage();
        await dashboard.waitForShelvesToLoad();
        const shelf = await dashboard.getShelfByName(testShelfName);
        await expect(shelf.emptyState).toBeVisible();
        await expect(shelf.emptyState).toContainText('No items in this shelf yet');
        await use(shelf);
    },

    randomItemName: async ({ }, use) => {
        const itemName = faker.commerce.productName() + '-' + Date.now();
        await use(itemName);
    },

    accessToken: async ({ }, use) => {
        const token = await getToken(UserRole.USER);
        await use(token);
    },

    label1: async ({ }, use) => {
        const label = faker.commerce.productMaterial() + Date.now();
        await req<any>(
            'POST',
            'dashboard.createLabel',
            { name: label, color: faker.color.rgb() },
            await getToken(UserRole.USER)
        );
        await use(label);
    },

    label2: async ({ }, use) => {
        const label = faker.commerce.productMaterial() + Date.now();
        await req<any>(
            'POST',
            'dashboard.createLabel',
            { name: label, color: faker.color.rgb() },
            await getToken(UserRole.USER)
        );
        await use(label);
    }
});

export { expect };
