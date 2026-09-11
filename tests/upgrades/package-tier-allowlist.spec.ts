import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { UpgradeAccountPage } from '../../pages/UpgradeAccountPage';
import { FIXTURE_ACCOUNTS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-047/049/052 - the Package Upgrade
// allow/disallow matrix. Uses the sheet's own pre-existing fixture accounts
// at each tier (see FIXTURE_ACCOUNTS) rather than building each tier from
// scratch through a chain of real payments.
test.describe('Package Upgrade Allow-list', () => {
  test('TC-STU-047: Power package upgrade to Silver is allowed', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);

    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();

    await expect(upgradeAccountPage.packageCard('silver')).toBeVisible({ timeout: 20_000 });
  });

  test('TC-STU-049: Showtime package upgrade to Gold is allowed', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(
      FIXTURE_ACCOUNTS.showtimeTier.email,
      FIXTURE_ACCOUNTS.showtimeTier.password
    );

    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();

    await expect(upgradeAccountPage.packageCard('gold')).toBeVisible({ timeout: 20_000 });
  });

  test('TC-STU-052: Express Extra package upgrade to Silver is allowed', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(
      FIXTURE_ACCOUNTS.expressExtraTier.email,
      FIXTURE_ACCOUNTS.expressExtraTier.password
    );

    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();

    await expect(upgradeAccountPage.packageCard('silver')).toBeVisible({ timeout: 20_000 });
  });
});
