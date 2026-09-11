import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { uniqueEmail } from '../../utils/dataGenerator';
import { registerFreeStudent } from '../../utils/testUser';
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
});
