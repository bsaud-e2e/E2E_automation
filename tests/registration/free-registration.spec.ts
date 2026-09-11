import { test, expect } from '../fixtures';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { ALLOWED_EMAIL_DOMAIN, DEFAULT_PASSWORD, EXAM_TYPE_CODE } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-007 family / Dashboard & Environment URLs -
// "Free registration entry point (confirmed live)".
test.describe('Student Registration - Free Trial Sign Up', () => {
  test('TC-STU-FREE-01: Student completes the Free Sign Up form with valid details', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const email = uniqueEmail('e2e.stu.free', ALLOWED_EMAIL_DOMAIN);

    await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();

    await expect(registrationPage.firstNameInput).toBeVisible();
    await expect(registrationPage.lastNameInput).toBeVisible();
    await expect(registrationPage.passwordInput).toBeVisible();

    await registrationPage.fillPersonalDetails('Auto', 'QA', DEFAULT_PASSWORD);
    await registrationPage.submit();

    // Expected result (TC-STU-007 analogue): registration succeeds and the
    // student is taken off the sign-up form (onboarding wizard / dashboard).
    await expect(async () => {
      expect(registrationPage.currentUrl).not.toContain('Registration/Free');
    }).toPass({ timeout: 20_000 });
  });

  test('TC-STU-FREE-02: Submitting step 1 without an email shows inline validation', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
    await registrationPage.submit();

    const errors = await registrationPage.getValidationErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(await registrationPage.isEmailFieldFlaggedInvalid()).toBe(true);
  });

  test('TC-STU-FREE-03: Submitting step 2 with an empty password is rejected', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const email = uniqueEmail('e2e.stu.free.nopass', ALLOWED_EMAIL_DOMAIN);

    await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();

    await registrationPage.fillPersonalDetails('Auto', 'QA');
    await registrationPage.submit();

    const errors = await registrationPage.getValidationErrors();
    expect(errors.join(' ')).toMatch(/required/i);
    expect(registrationPage.currentUrl).toContain('Registration/Free');
  });
});
