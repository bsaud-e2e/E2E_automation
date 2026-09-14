import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { FIXTURE_ACCOUNTS, GRADED_SUBMISSION_URL } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-E2E-054 (Smoke)
// "View the teacher's graded feedback (cross-role leg 5 of 6)". Its own
// precondition (TC-E2E-004, a Teacher grading a submission) is out of
// scope for this Student-only suite, so this uses a pre-existing account
// confirmed live to already have a teacher-graded submission instead of
// creating one - see FIXTURE_ACCOUNTS.gradedSubmission. The Assessments
// grid's own UI path to reach it is blocked by the same broken accordion-
// population defect as TC-E2E-053 (confirmed live: expanding the "Write
// Email" group never loads any row via automation, even after a full
// expand+wait, despite the submission genuinely existing and being
// reachable by URL) - so this navigates directly to the known graded
// submission instead of the grid click path.
test.describe('Graded Feedback', () => {
  test('TC-E2E-054: The score and comment a teacher entered are visible to the student', { tag: '@smoke' }, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(
      FIXTURE_ACCOUNTS.gradedSubmission.email,
      FIXTURE_ACCOUNTS.gradedSubmission.password
    );

    await page.goto(GRADED_SUBMISSION_URL, { waitUntil: 'domcontentloaded' });

    // Expected result: the score and the Comment the Teacher entered are
    // visible to the student.
    await expect(page.getByText('Supervisor Score')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#Score')).toHaveValue('17');
    await expect(page.locator('#Comment')).not.toBeEmpty();
  });
});
