import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { FIXTURE_ACCOUNTS, STUDENT_APP_HOST } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-E2E-053 (Smoke)
// "Submit a Writing/Speaking assessment for teacher grading (cross-role
// leg 3 of 6)" - renumbered from an earlier draft's TC-E2E-003; that
// draft's TC-STU-097/TC-STU-104 (IELTS-specific Speaking/Writing
// submission via the Assessments menu) were retired as separate IDs in
// this final sheet and folded into this one. Confirmed live (2026-09-14,
// PTE Power fixture account): the Assessments page's Writing/Speaking
// accordion groups never expand on click (aria-expanded stays "false",
// height stays 0px - confirmed with a real mouse-moved click, not just a
// plain one), so no assessment row is ever reachable - this is the same
// broken activity-launch entry point TC-E2E-053 depends on. Written to
// assert the CORRECT/expected behavior (an accordion group expands and
// shows at least one assessment row) - same treatment as TC-STU-011's
// earlier draft - so this is EXPECTED TO FAIL until the defect is fixed;
// see the README's "Known findings". This only covers the Student-side
// entry point being reachable, not the full cross-role grading flow
// (Teacher session out of scope for this Student-only suite).
test.describe('Writing/Speaking Assessments', () => {
  test('TC-E2E-053: An Assessments accordion group expands and shows a submittable row', { tag: '@smoke' }, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    await page.goto(`${STUDENT_APP_HOST}/Student/Assessment`, { waitUntil: 'domcontentloaded' });

    const writingTab = page.locator('a[data-toggle="tab"]', { hasText: 'Writing' });
    await writingTab.waitFor({ state: 'visible', timeout: 15_000 });
    await writingTab.click();

    const groupHeader = page.locator('a[href="#group-10"]'); // "Summarize Written Text"
    await groupHeader.waitFor({ state: 'visible', timeout: 10_000 });
    await groupHeader.scrollIntoViewIfNeeded();
    const box = await groupHeader.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await groupHeader.click();

    // Expected result: the group expands and shows at least one assessment
    // row to submit.
    await expect(groupHeader).toHaveAttribute('aria-expanded', 'true', { timeout: 10_000 });
    await expect(async () => {
      const rowCount = await page.locator('#writingAssessment-10 tr, #writingAssessment-10 td').count();
      expect(rowCount).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000 });
  });
});
