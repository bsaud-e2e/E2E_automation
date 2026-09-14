import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { SwitchCoursePage } from '../../pages/SwitchCoursePage';
import { createOnboardedStudent } from '../../utils/testUser';

// Reference: Student sheet, TC-STU-012 "Free student switches course at no cost".
test.describe('Switch Course', () => {
  test('TC-STU-012: Free student switches course at no cost', { tag: '@smoke' }, async ({ page }) => {
    await createOnboardedStudent(page, 'e2e.stu.switch');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    await dashboardPage.goToSwitchCourse();

    const switchCoursePage = new SwitchCoursePage(page);
    await switchCoursePage.acknowledgeProgressWarning();
    await switchCoursePage.selectExamType('PTE Core');
    await switchCoursePage.chooseUpgrade(false);
    await switchCoursePage.convertCourseNow();

    // Expected result: the switch completes with no payment required, and
    // the student lands on a confirmation page for the new course.
    await expect(switchCoursePage.confirmationHeading).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('ChangePackageConfirmation?isSuccess=True');
    await expect(switchCoursePage.goToClassroomLink).toBeVisible();
  });
});
