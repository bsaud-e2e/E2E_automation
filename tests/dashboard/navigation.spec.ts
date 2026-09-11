import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { createOnboardedStudent } from '../../utils/testUser';

// Reference: Student sheet, TC-STU-005 "All dashboard navigation links work".
// The sheet's own execution checked Course Materials, Assessments and Online
// Classes specifically - each is a click-to-expand submenu toggle rather
// than a direct link, so "works" means its known submenu items appear.
test.describe('Dashboard Navigation', () => {
  test('TC-STU-005: Course Materials, Assessments and Online Classes menus open correctly', async ({ page }) => {
    await createOnboardedStudent(page, 'e2e.stu.nav');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const submenus: Record<string, string[]> = {
      'COURSE MATERIALS': ['PTE'],
      ASSESSMENTS: ['MINI MOCK TEST', 'GUIDED MOCK TEST', 'WRITING/SPEAKING ASSESSMENTS'],
      'ONLINE CLASSES': ['LIVE CLASSES', 'RECORDED CLASSES'],
    };

    for (const [menu, expectedItems] of Object.entries(submenus)) {
      await dashboardPage.expandNavItem(menu);
      for (const item of expectedItems) {
        await expect(page.locator('a', { hasText: item }).first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
