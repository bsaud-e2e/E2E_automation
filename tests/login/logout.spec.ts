import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { createOnboardedStudent } from '../../utils/testUser';
import { STUDENT_APP_HOST } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-003 "Student logs out successfully".
test.describe('Student Logout', () => {
  test('TC-STU-003: Logging out ends the session and blocks direct dashboard access', async ({ page }) => {
    await createOnboardedStudent(page, 'e2e.stu.logout');

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();
    await dashboardPage.logout();

    await expect(async () => {
      expect(page.url()).not.toContain('/Student/Home');
    }).toPass({ timeout: 15_000 });

    // Expected result: navigating straight back to the dashboard requires logging in again.
    await page.goto(`${STUDENT_APP_HOST}/Student/Home`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await expect(async () => {
      expect(page.url()).not.toContain('/Student/Home');
    }).toPass({ timeout: 20_000 });
  });
});
