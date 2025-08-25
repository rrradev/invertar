import { Page } from "@playwright/test";

export default abstract class BasePage {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    abstract open(): Promise<void>;
    abstract shouldBeVisible(): Promise<void>;

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

    async expireCookie(cookieName: string) {
        const context = this.page.context();
        const cookies = await context.cookies();
        const target = cookies.find(c => c.name === cookieName);

        if (target) {
            await context.addCookies([{
                name: target.name,
                value: '',
                domain: target.domain,
                path: target.path,
                expires: 0,
                httpOnly: target.httpOnly,
                secure: target.secure,
                sameSite: target.sameSite,
            }]);
        }
    }

}