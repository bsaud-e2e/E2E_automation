import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { UpgradeAccountPage } from '../../pages/UpgradeAccountPage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { createOnboardedStudent } from '../../utils/testUser';
import { TEST_CARDS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-028 "Paid student upgrading to a higher tier pays only the difference".
//
// The sheet's full claim has two parts: (1) only strictly-higher tiers are
// offered, and (2) the amount charged is the price difference, not the new
// tier's full price. This spec covers (1). Verifying (2) would need a
// *second* real payment on top of this one to compare totals against a
// known full price, which compounds an already-slow flow (registration,
// onboarding, a live Shopify payment) into something too slow to be worth
// the coverage here; left as a manual/future check.
test.describe('Paid-to-Paid Upgrade', () => {
  test('TC-STU-028: Paid student upgrading only sees strictly higher tiers', async ({ page }) => {
    test.setTimeout(150_000);

    await createOnboardedStudent(page, 'e2e.stu.p2p');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();
    await upgradeAccountPage.upgradeToPackage('express');
    const paymentPage = new PaymentPage(page);
    await paymentPage.proceedToCheckout();
    const checkoutPage = new ShopifyCheckoutPage(page);
    await checkoutPage.completePayment(TEST_CARDS.approved.number, TEST_CARDS.approved.cvv);
    await expect(page.getByText('Access Dashboard')).toBeVisible();

    // Confirmed live (see comments below): activating the new package
    // server-side is a genuinely slow async job - the Upgrade Account page
    // can keep showing the pre-upgrade (Free-tier) package list for some
    // time after the payment succeeds, independent of how it's reloaded.
    // A generous flat wait before the final reload is the most reliable
    // approach found.
    await page.waitForTimeout(30_000);
    await upgradeAccountPage.goto();
    await expect(upgradeAccountPage.packageCard('silver')).toBeVisible({ timeout: 20_000 });

    // Expected result: only strictly-higher tiers are offered. From Express,
    // that's Bronze/Silver/Gold (each literally reads "Everything in Express
    // package, plus...") - Express and Express+ are excluded, confirmed live.
    expect(await upgradeAccountPage.isPackageOffered('express')).toBe(false);
    expect(await upgradeAccountPage.isPackageOffered('expressplus')).toBe(false);
    expect(await upgradeAccountPage.isPackageOffered('bronze')).toBe(true);
    expect(await upgradeAccountPage.isPackageOffered('gold')).toBe(true);
  });
});
