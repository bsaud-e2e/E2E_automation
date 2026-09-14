import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { StudyPathwayWidgetPage } from '../../pages/StudyPathwayWidgetPage';
import { FIXTURE_ACCOUNTS } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-STU-070 (Smoke)
// "Unlock the next skill set after completing one in the Study Pathway" /
// TC-STU-071 (Smoke) "Submit a sample practice activity (IELTS Academic)"
// - renumbered from an earlier draft's TC-STU-075/076. The sheet specifies
// an IELTS Academic account; this uses the PTE powerTier fixture instead
// (no IELTS Academic fixture account available) since the underlying
// defect below was confirmed to block the whole Study Pathway mechanism
// regardless of exam type - flagging the exam-type mismatch rather than
// silently ignoring it.
//
// Both IDs are blocked by the same defect: clicking a Study Pathway
// practice item produces no observable effect. Confirmed live
// (2026-09-14) with full tree expansion (skill category -> submodule
// panel -> "Practice 1: Write Essay") and human-like mouse-moved clicks:
// the widget's own #studypathway-dialog-iframe never receives a src,
// meaning the click genuinely does nothing. Written to assert the
// CORRECT/expected behavior (a practice item opens something) - same
// treatment as TC-STU-011's earlier draft - so this is EXPECTED TO FAIL
// until the defect is fixed; see the README's "Known findings". Both TC
// IDs collapse into one test since they're blocked by the identical
// broken entry point.
test.describe('Study Pathway Practice Items', () => {
  test('TC-STU-070 / TC-STU-071: Clicking a Study Pathway practice item opens it', { tag: '@smoke' }, async ({ page }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const widgetPage = new StudyPathwayWidgetPage(page);
    await widgetPage.waitForLoaded();

    const writingHeader = widgetPage.frame.locator('a[aria-label*="Writing Essential"]').first();
    await writingHeader.waitFor({ state: 'visible', timeout: 15_000 });
    await writingHeader.click({ force: true });

    const writeEssayHeader = widgetPage.frame.locator('a[aria-label="Essential Write essay"]').first();
    await writeEssayHeader.waitFor({ state: 'visible', timeout: 10_000 });
    await writeEssayHeader.click({ force: true });

    const practiceItem = widgetPage.frame.getByText('Practice 1: Write Essay', { exact: true }).first();
    await practiceItem.waitFor({ state: 'visible', timeout: 10_000 });
    await practiceItem.click({ force: true });

    // Expected result: the practice item opens (the widget's dialog iframe
    // gets populated with the activity).
    const dialogIframe = page.locator('iframe.studypathway-dialog-iframe');
    await expect(async () => {
      const src = await dialogIframe.getAttribute('src');
      expect(src).toBeTruthy();
    }).toPass({ timeout: 15_000 });
  });
});
