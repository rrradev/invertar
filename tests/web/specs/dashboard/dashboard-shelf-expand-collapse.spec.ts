import { test } from '../../fixtures/user.fixture';

test.describe('Dashboard - Shelf Expand/Collapse', () => {
    test('should persist shelf state across page reloads', { tag: "@smoke" },
        async ({ dashboard, shelf }) => {
            await shelf.shouldBeExpanded();

            await shelf.collapse();
            await shelf.shouldBeCollapsed();

            await dashboard.page.reload();
            await shelf.shouldBeCollapsed();
        });
    test('should be expanded for newly created shelves', { tag: "@smoke" },
        async ({ dashboard, shelf }) => {
            await shelf.shouldBeExpanded();

            await dashboard.page.reload();
            await shelf.shouldBeExpanded();
        });
});