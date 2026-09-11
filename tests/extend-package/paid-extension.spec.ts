import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { ExtendPackagePage } from '../../pages/ExtendPackagePage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { FIXTURE_ACCOUNTS, TEST_CARDS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-020 "Paid extension adds time from the current expiry date".
//
// Uses the sheet's own expired-paid fixture account (demo-selfgraded4).
// Verifying the extension is dated from the *current* expiry rather than
// today would need reading exact expiry dates before/after, which isn't
// exposed anywhere in the UI this suite has found - so this covers what's
// directly verifiable: the paid extension purchase completes successfully
// and the "Access Period Expired" block clears.
test.describe('Paid Package Extension', () => {
  test('TC-STU-020: Paid student extends access by 1 week through standard checkout', async ({ page }) => {
    test.setTimeout(120_000);

    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(
      FIXTURE_ACCOUNTS.paidForExtension.email,
      FIXTURE_ACCOUNTS.paidForExtension.password
    );

    const extendPackagePage = new ExtendPackagePage(page);
    await extendPackagePage.openExtendFromExpiredModal();
    await extendPackagePage.selectExtensionPeriod('1 Week');
    await extendPackagePage.buyNow();

    const paymentPage = new PaymentPage(page);
    await expect(page.getByRole('heading', { name: /Extend Package Duration - 1 Week/i })).toBeVisible({
      timeout: 20_000,
    });
    await paymentPage.proceedToCheckout();

    const checkoutPage = new ShopifyCheckoutPage(page);
    await checkoutPage.completePayment(TEST_CARDS.approved.number, TEST_CARDS.approved.cvv);

    // Expected result: the extension payment succeeds and access is restored.
    await expect(page.getByText('Access Dashboard')).toBeVisible();
  });
});
