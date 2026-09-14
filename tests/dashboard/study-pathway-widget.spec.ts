import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { StudyPathwayWidgetPage } from '../../pages/StudyPathwayWidgetPage';
import { FIXTURE_ACCOUNTS } from '../../test-data/registrationData';
import { createOnboardedStudent } from '../../utils/testUser';

// SUPPLEMENTARY - not part of the final Stage_TestCase_E2E sheet's 74
// Student-role cases (TC-STU-081/091/092/093 were gap-analysis additions
// from an earlier draft sheet, source: QA_Test_Cases 1.xlsx, and were cut
// from the final curated list). Kept as bonus dashboard coverage for now
// pending a keep/remove decision - flag before relying on these IDs
// anywhere else. Confirmed live for a PTE account: the widget renders one
// skill-category panel per module (Speaking/Writing/Reading/Listening),
// not the sheet's assumed 5-row/8-button IELTS-style layout - see
// StudyPathwayWidgetPage for the adaptation, the same kind of
// environment-specific adjustment already documented for TC-STU-067.
test.describe('Score Calculator Menu Visibility', () => {
  test('TC-STU-081 (supplementary, not in final sheet): Score Calculator menu item is visible for both free and paid students', { tag: '@regression' }, async ({ page }) => {
    test.setTimeout(60_000);
    await createOnboardedStudent(page, 'e2e.stu.sccheck.free');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();
    const widgetPage = new StudyPathwayWidgetPage(page);
    await expect(widgetPage.scoreCalculatorMenuItem).toBeVisible({ timeout: 15_000 });

    // Paid-tier check reuses a shared fixture account rather than a second full registration+payment.
    const loginPage = new LoginPage(page);
    await dashboardPage.logout();
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    await dashboardPage.dismissInfoModalIfPresent();
    await expect(widgetPage.scoreCalculatorMenuItem).toBeVisible({ timeout: 15_000 });
  });
});

// SUPPLEMENTARY - not part of the final sheet's 74 cases (see note above).
test.describe('Study Pathway Widget', () => {
  test('TC-STU-091 (supplementary, not in final sheet): Study Pathway widget loads and renders its skill-category panels', { tag: '@regression' }, async ({ page }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const widgetPage = new StudyPathwayWidgetPage(page);
    await widgetPage.waitForLoaded();

    const panelCount = await widgetPage.skillCategoryHeaders().count();
    expect(panelCount).toBeGreaterThan(0);
  });

  test('TC-STU-092 (supplementary, not in final sheet): Study Pathway lists skill tracks tagged Essential with a completion percentage', { tag: '@regression' }, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const widgetPage = new StudyPathwayWidgetPage(page);
    await widgetPage.waitForLoaded();

    // Confirmed live: PTE renders 4 skill categories (Speaking, Writing,
    // Reading, Listening), each tagged "Essential" with a "N% Completed"
    // indicator - not the sheet's assumed 5 (IELTS splits Writing into
    // Task 1/Task 2). The visible label text has no space between the skill
    // name and "Essential" (adjacent inline spans), so these match on the
    // panel's aria-label instead, which does.
    for (const skill of ['Speaking', 'Writing', 'Reading', 'Listening']) {
      await expect(widgetPage.frame.locator(`a[aria-label*="${skill} Essential"][aria-label*="% Completed"]`)).toBeVisible();
    }
    expect(await widgetPage.skillCategoryHeaders().count()).toBe(4);
  });

  test('TC-STU-093 (supplementary, not in final sheet): The Study Pathway Info Modal opens and dismisses cleanly', { tag: '@regression' }, async ({ page }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const widgetPage = new StudyPathwayWidgetPage(page);
    await widgetPage.waitForLoaded();

    await widgetPage.openInfoModal();
    await expect(widgetPage.infoModalDialog).toBeVisible({ timeout: 10_000 });
    await widgetPage.closeInfoModal();
    await expect(widgetPage.infoModalDialog).toBeHidden({ timeout: 10_000 });

    // The widget remains interactive after dismissing the modal.
    expect(await widgetPage.skillCategoryHeaders().count()).toBeGreaterThan(0);
  });
});
