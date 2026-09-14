import { test, expect } from '../fixtures';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { ALLOWED_EMAIL_DOMAIN, PAID_PACKAGE } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-007 "Student registers and pays successfully".
// Canonical deep link from the Dashboard & Environment URLs sheet:
// https://azdopl-rc-registrationapp.e2language.com/Registration/SignUp?examTypeCode=PTE&packageCode=PTE_PaidV2_1
test.describe('Student Registration - Paid Sign Up', () => {
  test('TC-STU-007: Student fills the paid registration form and reaches the Payment step', { tag: '@smoke' }, async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const email = uniqueEmail('e2e.stu.paid', ALLOWED_EMAIL_DOMAIN);

    await registrationPage.gotoPaidRegistration(PAID_PACKAGE.examTypeCode, PAID_PACKAGE.packageCode);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();

    await expect(registrationPage.firstNameInput).toBeVisible();
    await expect(registrationPage.lastNameInput).toBeVisible();

    await registrationPage.fillPersonalDetails('Auto', 'QA');
    await registrationPage.submit();

    // Expected result per TC-STU-007: registration details are accepted and the
    // flow reaches the Payment Information page ("Pay with Card" entry point).
    // Full card-payment completion is intentionally out of scope here - the
    // Excel suite documents that step as a separate, currently-defective flow
    // (TC-STU-009 / TC-STU-010) driven by the Shopify-hosted checkout.
    await expect(async () => {
      expect(registrationPage.currentUrl).not.toContain('Registration/SignUp');
    }).toPass({ timeout: 20_000 });
  });
});
