import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { registerFreeStudent } from '../../utils/testUser';
import { fetchVerificationCode } from '../../utils/mailinator';
import { ALLOWED_EMAIL_DOMAIN } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-055 / TC-STU-057 (Account & Security - Password Reset).
test.describe('Password Reset', () => {
  test('TC-STU-055: Student requests a password reset and gets a verification code', async ({ page }) => {
    const { email } = await registerFreeStudent(page, 'e2e.stu.reset');

    const loginPage = new LoginPage(page);
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await loginPage.gotoLogin();
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.requestReset(email);

    await expect(async () => {
      expect(await forgotPasswordPage.getConfirmationText()).toMatch(/verification code has been sent/i);
    }).toPass({ timeout: 15_000 });
  });

  test('TC-STU-057: Password reset shows the same message for a registered and an unregistered email', async ({
    page,
  }) => {
    const { email: registeredEmail } = await registerFreeStudent(page, 'e2e.stu.reset.real');
    const unregisteredEmail = uniqueEmail('e2e.stu.reset.notreal', ALLOWED_EMAIL_DOMAIN);

    const loginPage = new LoginPage(page);
    const forgotPasswordPage = new ForgotPasswordPage(page);

    await loginPage.gotoLogin();
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.requestReset(registeredEmail);
    let registeredMessage = '';
    await expect(async () => {
      registeredMessage = await forgotPasswordPage.getConfirmationText();
      expect(registeredMessage).toMatch(/verification code has been sent/i);
    }).toPass({ timeout: 15_000 });

    await loginPage.gotoLogin();
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.requestReset(unregisteredEmail);
    let unregisteredMessage = '';
    await expect(async () => {
      unregisteredMessage = await forgotPasswordPage.getConfirmationText();
      expect(unregisteredMessage).toMatch(/verification code has been sent/i);
    }).toPass({ timeout: 15_000 });

    // Expected result: identical confirmation regardless of whether the
    // email is registered, so no account information leaks.
    expect(unregisteredMessage).toBe(registeredMessage);
  });

  // Reference: Student sheet, TC-STU-056 "Student resets password via email
  // link" - the sheet's own wording note clarifies this is actually a
  // 6-digit code typed into the page, not a clickable link. Retrieves the
  // real OTP from the account's public @mailinator.com inbox (no login
  // needed for a public Mailinator inbox) to drive the flow end-to-end
  // rather than stopping at "an email was sent". This spec covers request +
  // OTP retrieval + verification (the reset flow's Continue button becoming
  // enabled, which requires the code to have been accepted as correct) -
  // the same kind of intentionally-scoped coverage as TC-STU-028, since the
  // B2C policy's subsequent "set new password" step only renders once
  // Continue is submitted and wasn't reliably reproducible during
  // exploration.
  test('TC-STU-056: Student receives and verifies the password-reset OTP by email', async ({ page, context }) => {
    test.setTimeout(240_000);
    const { email } = await registerFreeStudent(page, 'e2e.stu.otpreset');
    const inboxName = email.split('@')[0];

    const loginPage = new LoginPage(page);
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await loginPage.gotoLogin();
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.requestReset(email);
    await expect(async () => {
      expect(await forgotPasswordPage.getConfirmationText()).toMatch(/verification code has been sent/i);
    }).toPass({ timeout: 15_000 });

    const code = await fetchVerificationCode(context, inboxName);
    expect(code).toBeTruthy();

    await forgotPasswordPage.enterAndVerifyCode(code as string);

    // Expected result (partial - see comment above): the OTP is accepted,
    // enabling the flow to continue past email verification.
    await expect(page.locator('#continue')).toBeVisible({ timeout: 15_000 });
  });
});
