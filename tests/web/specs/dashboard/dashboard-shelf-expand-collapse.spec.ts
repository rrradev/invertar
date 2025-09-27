import Dashboard from 'tests/web/pages/dashboard.page';
import { test, expect } from '../../fixtures/user.fixture';

test.describe('Dashboard - Shelf Expand/Collapse', () => {
    test('should display shelf expand/collapse buttons', { tag: ["@smoke", "@chromium-only"] },
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
            await dashboard.goto("/dashboard");

            // Wait for dashboard to load
            await dashboard.shouldBeVisible(15000);

            // Check if shelf expand buttons are present
            const shelfExpandButtons = page.locator('[data-testid="shelf-expand-button"]');
            const buttonCount = await shelfExpandButtons.count();
            
            if (buttonCount > 0) {
                // Verify first expand button is visible and has correct attributes
                const firstButton = shelfExpandButtons.first();
                await expect(firstButton).toBeVisible();
                await expect(firstButton).toHaveAttribute('aria-label');
                
                // Check that the button has the correct SVG icon
                const svgIcon = firstButton.locator('svg');
                await expect(svgIcon).toBeVisible();
            }
        });

    test('should toggle shelf expansion when button is clicked', { tag: ["@smoke", "@chromium-only"] },
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
            dashboard.setDelay("**/*", 250);
            await dashboard.goto("/dashboard");
            await dashboard.shouldBeVisible(15000);

            const shelfExpandButtons = page.locator('[data-testid="shelf-expand-button"]');
            const buttonCount = await shelfExpandButtons.count();
            
            if (buttonCount > 0) {
                const firstButton = shelfExpandButtons.first();
                const firstShelf = page.locator('[data-testid="shelf-item"]').first();
                
                // Get initial state
                const initialAriaLabel = await firstButton.getAttribute('aria-label');
                const initialArrowRotation = await firstButton.locator('svg').getAttribute('class');
                
                // Click the expand/collapse button
                await firstButton.click();
                
                // Wait for the state to change
                await page.waitForTimeout(1000);
                
                // Verify the button's aria-label changed
                const newAriaLabel = await firstButton.getAttribute('aria-label');
                expect(newAriaLabel).not.toBe(initialAriaLabel);
                
                // Verify arrow rotation changed
                const newArrowRotation = await firstButton.locator('svg').getAttribute('class');
                expect(newArrowRotation).not.toBe(initialArrowRotation);
            }
        });

    test('should show loading state when expanding collapsed shelf', { tag: ["@smoke", "@chromium-only"] },
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
            // Add extra delay to API requests to make loading state more visible
            dashboard.setDelay("**/trpc/dashboard.getShelfItems", 2000);
            await dashboard.goto("/dashboard");
            await dashboard.shouldBeVisible(15000);

            const shelfExpandButtons = page.locator('[data-testid="shelf-expand-button"]');
            const buttonCount = await shelfExpandButtons.count();
            
            if (buttonCount > 0) {
                const firstButton = shelfExpandButtons.first();
                
                // First collapse the shelf if it's expanded
                const initialAriaLabel = await firstButton.getAttribute('aria-label');
                if (initialAriaLabel?.includes('Collapse')) {
                    await firstButton.click();
                    await page.waitForTimeout(500);
                }
                
                // Now expand it to see loading state
                await firstButton.click();
                
                // Check for loading spinner during the request
                const loadingSpinner = firstButton.locator('svg.animate-spin');
                await expect(loadingSpinner).toBeVisible({ timeout: 500 });
                
                // Wait for loading to complete
                await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });
            }
        });

    test('should persist shelf state across page reloads', { tag: ["@smoke", "@chromium-only"] },
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
            dashboard.setDelay("**/*", 250);
            await dashboard.goto("/dashboard");
            await dashboard.shouldBeVisible(15000);

            const shelfExpandButtons = page.locator('[data-testid="shelf-expand-button"]');
            const buttonCount = await shelfExpandButtons.count();
            
            if (buttonCount > 0) {
                const firstButton = shelfExpandButtons.first();
                
                // Get initial state
                const initialAriaLabel = await firstButton.getAttribute('aria-label');
                
                // Toggle the state
                await firstButton.click();
                await page.waitForTimeout(1000);
                
                // Get the new state
                const newAriaLabel = await firstButton.getAttribute('aria-label');
                
                // Reload the page
                await page.reload();
                await dashboard.shouldBeVisible(15000);
                
                // Check that the state persisted
                const reloadedButton = page.locator('[data-testid="shelf-expand-button"]').first();
                const persistedAriaLabel = await reloadedButton.getAttribute('aria-label');
                
                expect(persistedAriaLabel).toBe(newAriaLabel);
                expect(persistedAriaLabel).not.toBe(initialAriaLabel);
            }
        });

    test('should show correct stats for collapsed vs expanded shelves', { tag: ["@smoke", "@chromium-only"] },
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
            dashboard.setDelay("**/*", 250);
            await dashboard.goto("/dashboard");
            await dashboard.shouldBeVisible(15000);

            const shelfItems = page.locator('[data-testid="shelf-item"]');
            const shelfCount = await shelfItems.count();
            
            if (shelfCount > 0) {
                const firstShelf = shelfItems.first();
                const firstButton = firstShelf.locator('[data-testid="shelf-expand-button"]');
                const statsElement = firstShelf.locator('[data-testid="shelf-stats"]');
                const totalValueElement = firstShelf.locator('[data-testid="shelf-total-value"]');
                
                // Ensure shelf is expanded first
                const ariaLabel = await firstButton.getAttribute('aria-label');
                if (ariaLabel?.includes('Expand')) {
                    await firstButton.click();
                    await page.waitForTimeout(1000);
                }
                
                // Get expanded stats
                const expandedStats = await statsElement.textContent();
                const expandedValue = await totalValueElement.textContent();
                
                // Collapse the shelf
                await firstButton.click();
                await page.waitForTimeout(1000);
                
                // Get collapsed stats
                const collapsedStats = await statsElement.textContent();
                const collapsedValue = await totalValueElement.textContent();
                
                // Verify collapsed state shows '?' for item count and '---' for value
                expect(collapsedStats).toContain('?');
                expect(collapsedValue).toBe('---');
                
                // Verify expanded state shows actual numbers
                expect(expandedStats).not.toContain('?');
                expect(expandedValue).not.toBe('---');
            }
        });
});