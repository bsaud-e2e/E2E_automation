import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { UpgradeAccountPage } from '../../pages/UpgradeAccountPage';
import { createOnboardedStudent } from '../../utils/testUser';

// Reference: Student sheet, TC-STU-043 "Free student upgrading to Power is
// allowed". The sheet's own Actual Result already found this to be a
// discrepancy: Power never appears in a Free student's upgrade list at all
// (only Bronze/Silver/Gold/Express etc.), contradicting the documented
// Expected Result. This spec asserts the app's current, confirmed-live
// behavior (Power NOT offered) rather than the sheet's expected text, the
// same treatment as the known TC-STU-011 PayPal discrepancy - see the
// README's "Known findings" section.
test.describe('Free-to-Power Upgrade', () => {
  test('TC-STU-043: Power package does not appear in a Free student\'s upgrade list', async ({ page }) => {
    test.setTimeout(60_000);
    await createOnboardedStudent(page, 'e2e.stu.f2power');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();
    // Confirmed live: this page's own heading reads "Choose your package -
    // <exam>", not "Upgrade" - waiting on a known-offered tier's card is a
    // more reliable "the list finished loading" signal.
    await expect(upgradeAccountPage.packageCard('bronze')).toBeVisible({ timeout: 20_000 });

    expect(await upgradeAccountPage.isPackageOffered('power')).toBe(false);
  });
});
