import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { StudyPathwayWidgetPage } from '../../pages/StudyPathwayWidgetPage';
import { FIXTURE_ACCOUNTS } from '../../test-data/registrationData';
import { createOnboardedStudent } from '../../utils/testUser';

// Reference: Student sheet, TC-STU-081 / 091 / 092 / 093 - all gap-analysis
// additions (source: QA_Test_Cases 1.xlsx) not yet executed against the live
// app when the sheet was written. Confirmed live for a PTE account: the
// widget renders one skill-category panel per module (Speaking/Writing/
// Reading/Listening), not the sheet's assumed 5-row/8-button IELTS-style
// layout - see StudyPathwayWidgetPage for the adaptation, the same kind of
// environment-specific adjustment already documented for TC-STU-072.
test.describe('Score Calculator Menu Visibility', () => {
  test('TC-STU-081: Score Calculator menu item is visible for both free and paid students', async ({ page }) => {
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

test.describe('Study Pathway Widget', () => {
  test('TC-STU-091: Study Pathway widget loads and renders its skill-category panels', async ({ page }) => {
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

  test('TC-STU-092: Study Pathway lists skill tracks tagged Essential with a completion percentage', async ({
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

  test('TC-STU-093: The Study Pathway Info Modal opens and dismisses cleanly', async ({ page }) => {
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
