import { test, expect } from '../fixtures';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { ALLOWED_EMAIL_DOMAIN, PAID_PACKAGE } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-011 "Card and PayPal payment options both appear".
test.describe('Payment Method Visibility', () => {
  test('TC-STU-011: Card and PayPal payment options both appear on checkout', async ({ page }) => {
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
    await expect(checkoutPage.paypalOption).toBeVisible({ timeout: 15_000 });
  });
});
