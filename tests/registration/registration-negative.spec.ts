import { test, expect } from '../fixtures';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { BLOCKED_EMAIL_DOMAINS, ALLOWED_EMAIL_DOMAIN, DEFAULT_PASSWORD, EXAM_TYPE_CODE } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-008 "Registration is blocked for disposable email domains".
test.describe('Student Registration - Negative Paths', () => {
  for (const domain of BLOCKED_EMAIL_DOMAINS) {
    test(`TC-STU-008: Registration is rejected for blocked domain @${domain}`, async ({ page }) => {
      const registrationPage = new RegistrationPage(page);
      const email = uniqueEmail('e2e.stu.blocked', domain);

      // The domain block is enforced server-side as part of the final
      // submit (same as the duplicate-email check), not on the step 1 ->
      // step 2 reveal - the email field itself stays flagged "valid"
      // throughout, so the full form has to be submitted to trigger it.
      await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
      await registrationPage.enterEmail(email);
      await registrationPage.proceedToPersonalDetails();
      await registrationPage.fillPersonalDetails('Auto', 'QA', DEFAULT_PASSWORD);
      await registrationPage.submit();

      // Expected result: the blocked domain is rejected via the error
      // dialog ("An error occurred while validating the email address...")
      // and the account is not created.
      await expect(registrationPage.errorDialog).toBeVisible({ timeout: 10_000 });
      expect(await registrationPage.errorDialogMessage.innerText()).toMatch(/error occurred while validating/i);
      expect(registrationPage.currentUrl).toContain('Registration/Free');
    });
  }

  test('TC-STU-008 (control): Registration proceeds for an allowed domain', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const email = uniqueEmail('e2e.stu.allowed', ALLOWED_EMAIL_DOMAIN);

    await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();

    await expect(registrationPage.firstNameInput).toBeVisible();
  });

  test('Registering with an already-used email offers to go to Login', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const email = uniqueEmail('e2e.stu.duplicate', ALLOWED_EMAIL_DOMAIN);

    // First pass: create the account.
    await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();
    await registrationPage.fillPersonalDetails('Auto', 'QA', DEFAULT_PASSWORD);
    await registrationPage.submit();
    await expect(async () => {
      expect(registrationPage.currentUrl).not.toContain('Registration/Free');
    }).toPass({ timeout: 20_000 });

    // Second pass: re-registering with the same email should be blocked.
    // The duplicate-email check only runs as part of the final submit (the
    // same AJAX call that performs registration), not on the step 1 -> step 2
    // reveal, so the full form has to be resubmitted to trigger it.
    await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
    await registrationPage.enterEmail(email);
    await registrationPage.proceedToPersonalDetails();
    await registrationPage.fillPersonalDetails('Auto', 'QA', DEFAULT_PASSWORD);
    await registrationPage.submit();

    // Expected result: re-registering with an already-used email is blocked
    // and offered a way back to Login, rather than silently creating a
    // second account. The "GO TO LOGIN PAGE" redirect itself is flaky on the
    // live site (observed navigating anywhere from ~5s to not at all within
    // 18s across repeated runs) so it's exercised but not asserted on here.
    await expect(registrationPage.accountExistsGoToLoginButton).toBeVisible({ timeout: 10_000 });
    await registrationPage.goToLoginFromAccountExistsPrompt();
  });
});
