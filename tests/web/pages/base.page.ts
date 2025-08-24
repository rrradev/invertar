import { Page } from "@playwright/test";

export default class BasePage {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async waitForRequest(url: string) {
        return this.page.waitForRequest(url);
    }

    async goto(url: string) {
        try {
            await this.page.goto(url, { timeout: 5000, waitUntil: 'networkidle' });
        } catch {

        }
    }

    async mock(url: string | RegExp,
        res: {
            body: string | Buffer,
            status?: number,
            contentType?: string,
        }
    ) {
        await this.page.route(url, async route => {
            route.fulfill({
                status: res.status ?? 200,
                body: res.body,
                contentType: res.contentType ?? 'application/json',
            });
        });
    }

    async deleteCookie(cookie: string) {
        const context = this.page.context();
        const cookies = await context.cookies();

        // Find the cookie you want to delete
        const cookieToDelete = cookies.find(c => c.name === cookie);

        if (cookieToDelete) {
            await context.clearCookies();
            // Re-set all cookies except the one you want to remove
            await context.addCookies(cookies.filter(c => c.name !== cookie));
        }
    }
}