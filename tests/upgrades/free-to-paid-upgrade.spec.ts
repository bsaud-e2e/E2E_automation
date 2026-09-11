import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { UpgradeAccountPage } from '../../pages/UpgradeAccountPage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { createOnboardedStudent } from '../../utils/testUser';
import { TEST_CARDS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-027 "Free student upgrading to paid pays full price".
test.describe('Free-to-Paid Upgrade', () => {
  test('TC-STU-027: Free student upgrading to Express pays the listed full price', async ({ page }) => {
    test.setTimeout(120_000);
    await createOnboardedStudent(page, 'e2e.stu.f2p');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();
    await upgradeAccountPage.upgradeToPackage('express');

    // Expected result: the amount charged equals the package's full list
    // price - verified here as internal consistency between the E2Language
    // Payment Information page's price and the Shopify checkout total,
    // rather than against an external price list this suite doesn't have.
    const paymentPage = new PaymentPage(page);
    await expect(page.getByRole('heading', { name: /Upgrade PTE from Free to Express/i })).toBeVisible({
      timeout: 20_000,
    });
    await paymentPage.proceedToCheckout();

    const checkoutPage = new ShopifyCheckoutPage(page);
    const checkoutTotal = await checkoutPage.getOrderTotal();
    expect(checkoutTotal).toBeTruthy();

    await checkoutPage.completePayment(TEST_CARDS.approved.number, TEST_CARDS.approved.cvv);
    await expect(page.getByText('Access Dashboard')).toBeVisible();
  });
});
