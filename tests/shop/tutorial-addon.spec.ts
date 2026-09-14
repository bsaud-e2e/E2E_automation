import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { ShopPage } from '../../pages/ShopPage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { FIXTURE_ACCOUNTS, TEST_CARDS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-036 "Student buys a Tutorial Session
// add-on with no purchase limit". The Shop's item is titled "Tutorial"
// (a single 45-min 1:1 session, distinct from the "Tutorials - Bundle of
// 2/3" cards) - confirmed live.
test.describe('E2 Shop - Tutorial Add-on', () => {
  test('TC-STU-036: Tutorial add-on can be bought twice with no purchase limit', { tag: '@smoke' }, async ({ page }) => {
    test.setTimeout(150_000);

    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    const shopPage = new ShopPage(page);
    const paymentPage = new PaymentPage(page);
    const checkoutPage = new ShopifyCheckoutPage(page);

    for (let purchase = 1; purchase <= 2; purchase++) {
      await dashboardPage.goToShop();
      await shopPage.openItemDetails('Tutorial');
      await shopPage.buyNow();

      await expect(page.getByRole('heading', { name: /Payment Information/i })).toBeVisible({ timeout: 20_000 });
      await paymentPage.proceedToCheckout();
      await checkoutPage.completePayment(TEST_CARDS.approved.number, TEST_CARDS.approved.cvv);

      // Expected result: the purchase succeeds, and Buy is still available afterward (no limit).
      await expect(page.getByText('Access Dashboard')).toBeVisible({ timeout: 30_000 });
      await dashboardPage.gotoHome();
    }
  });
});
