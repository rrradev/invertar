import { test } from '../../fixtures/user.fixture';

test.describe('Dashboard - Shelf Expand/Collapse', () => {
    test('should persist shelf state across page reloads', { tag: "@smoke" },
        async ({ dashboard, emptyShelf }) => {
            await emptyShelf.shouldBeExpanded();

            await emptyShelf.collapse();
            await emptyShelf.shouldBeCollapsed();
            await dashboard.page.reload();
            await emptyShelf.shouldBeCollapsed();
        });
    test('should be expanded for newly created shelves', { tag: "@smoke" },
        async ({ dashboard, emptyShelf }) => {
            await emptyShelf.shouldBeExpanded();

            await dashboard.page.reload();
            await emptyShelf.shouldBeExpanded();
        });
});