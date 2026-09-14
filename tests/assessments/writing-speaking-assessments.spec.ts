import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { FIXTURE_ACCOUNTS, STUDENT_APP_HOST } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-097 "Student submits an IELTS Speaking
// Assessment for teacher marking" / TC-STU-104 "Submitting IELTS Writing
// Task 1 via the Assessments menu marks it Submitted". The sheet's own
// Actual Result for TC-STU-097 explicitly flags checking whether this hits
// the same broken activity-launch defect as TC-E2E-003. Confirmed live
// (2026-09-14, PTE Power fixture account): the Assessments page's Writing/
// Speaking accordion groups never expand on click (aria-expanded stays
// "false", height stays 0px - confirmed with a real mouse-moved click, not
// just a plain one), so no assessment row is ever reachable. Written to
// assert the CORRECT/expected behavior (an accordion group expands and
// shows at least one assessment row) - same treatment as TC-STU-011 - so
// this is EXPECTED TO FAIL until the defect is fixed; see the README's
// "Known findings". Both TC IDs collapse into one test since they're
// blocked by the identical broken entry point (the same accordion widget,
// just a different tab/group).
test.describe('Writing/Speaking Assessments', () => {
  test('TC-STU-097 / TC-STU-104: An Assessments accordion group expands and shows a submittable row', async ({
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
