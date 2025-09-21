import Dashboard from 'tests/web/pages/dashboard.page';
import { test, expect } from '../../fixtures/user.fixture';

test.describe('Dashboard - Initial Loading', () => {
    test('should show initial init screen when auth is in progress', { tag: ["@smoke", "@chromium-only"] },
        async ({ page, accessToken }, testInfo) => {
            const baseURL = testInfo.project.use.baseURL!;

            await page.context().addCookies([
                {
                    name: 'accessToken',
                    value: accessToken,
                    domain: baseURL.replace('https://', '').replace('http://', ''),
                    path: '/',
                    httpOnly: process.env.PROD ? false : true,
                    secure: process.env.PROD ? true : false,
                    sameSite: 'Lax',
                },
            ]);

            const dashboard = new Dashboard(page);
            dashboard.setDelay("**/*", 250); // Delay all requests by 250ms to simulate loading
            await dashboard.goto("/");

            // Expect loading screen to show
            await expect(page.locator('.loading-title')).toHaveText('Loading Invertar...');
            await expect(page.locator('.loading-subtitle')).toHaveText('Preparing your workspace');

            // Expect dashboard screen to show after loading finishes
            await dashboard.shouldBeVisible(15000);
        });
});
