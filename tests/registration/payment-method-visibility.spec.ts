import { test, expect } from '../fixtures';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { ALLOWED_EMAIL_DOMAIN, PAID_PACKAGE } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-STU-011
// (Regression) - "Only debit card should be displayed in the payment
// information page". An earlier sheet draft said Card + PayPal should both
// appear; the live staging checkout (e2-staging-store.myshopify.com) only
// ever renders Credit Card, confirmed live and reproducible on every run -
// this final sheet's Expected Result already matches that reality.
test.describe('Payment Method Visibility', () => {
  test('TC-STU-011: Checkout offers Credit Card only - no PayPal option is rendered', { tag: '@regression' }, async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const paymentPage = new PaymentPage(page);
    const email = uniqueEmail('e2e.stu.paymethod', ALLOWED_EMAIL_DOMAIN);

    await registrationPage.gotoPaidRegistration(PAID_PACKAGE.examTypeCode, PAID_PACKAGE.packageCode);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();
    await registrationPage.fillPersonalDetails('Auto', 'QA');
    await registrationPage.submit();
    await expect(paymentPage.goToCheckoutLink).toBeVisible({ timeout: 20_000 });

    await paymentPage.proceedToCheckout();

    const checkoutPage = new ShopifyCheckoutPage(page);
    await expect(checkoutPage.creditCardOption).toBeVisible({ timeout: 15_000 });
    await expect(checkoutPage.paypalOption).not.toBeVisible();
  });
});
