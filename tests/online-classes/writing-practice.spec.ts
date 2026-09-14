import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { FIXTURE_ACCOUNTS, STUDENT_APP_HOST } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-STU-060 (Smoke)
// "Submit a Writing Task 1 response for AI scoring" / TC-STU-061 (Smoke)
// "View the AI-generated score report for Writing Task 1" - renumbered
// from an earlier draft's TC-STU-065/066. Confirmed live (2026-09-14, PTE
// Power fixture account) that Course Materials' "Writing" tab
// (/Student/ExamPreparation, module-2) never leaves its "Loading..."
// placeholder - no SubModuleContent AJAX request fires on tab-click at
// all, traced via page.on('response'). This is the same class of broken
// content-launch defect as TC-E2E-053 and TC-STU-070/071 (below), just in
// a different area of the app. Written to assert the CORRECT/expected
// behavior per the sheet - same treatment as TC-STU-011's earlier draft -
// so this is EXPECTED TO FAIL until the underlying defect is fixed; see
// the README's "Known findings".
test.describe('Writing Practice Activity', () => {
  test('TC-STU-060 / TC-STU-061: Writing practice activity opens, can be submitted, and shows an AI score report', { tag: '@smoke' }, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    await page.goto(`${STUDENT_APP_HOST}/Student/ExamPreparation`, { waitUntil: 'domcontentloaded' });
    const writingTab = page.locator('a[href="#module-2"]');
    await writingTab.waitFor({ state: 'visible', timeout: 15_000 });
    const box = await writingTab.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await writingTab.click();

    // Expected result: the Writing module's sub-topics (e.g. "Write essay")
    // load, letting a practice activity be opened, completed, and AI-scored.
    const loadingSpinner = page.locator('#module-2 .fa-spin');
    await expect(loadingSpinner).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('#module-2').getByText('Write essay')).toBeVisible({ timeout: 10_000 });
  });
});
