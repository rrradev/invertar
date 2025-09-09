import { Locator } from "@playwright/test";

export default class BaseComponent {
    container: Locator;

    constructor($: Locator) {
        this.container = $;
    }
}