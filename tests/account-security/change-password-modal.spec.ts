import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { MyAccountPage } from '../../pages/MyAccountPage';
import { createOnboardedStudent } from '../../utils/testUser';

// My Account > Account Settings > Reset Password (while logged in) - a
// separate, CAPTCHA-gated flow from the Forgot Password/OTP flow covered by
// TC-STU-056. Its submission can't be automated (see README "Known
// findings" - a real Google reCAPTCHA blocks it), so this only covers what
// is automatable: clicking Reset Password displays the Change Password
// dialog with its New Password / Confirm Password fields, reCAPTCHA, and
// Reset/Cancel actions - not the full submit flow.
test.describe('Change Password Modal', () => {
  test('Clicking Reset Password under My Account displays the Change Password dialog', async ({ page }) => {
    test.setTimeout(60_000);
    await createOnboardedStudent(page, 'e2e.stu.changepw');

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();
    await dashboardPage.goToMyAccount();

    const myAccountPage = new MyAccountPage(page);
    await myAccountPage.expandAccountSettings();
    await myAccountPage.openResetPasswordModal();

    // Expected result: the Change Password popup is displayed with its
    // New Password / Confirm Password fields, the reCAPTCHA widget, and the
    // Reset/Cancel actions all visible.
    await expect(myAccountPage.changePasswordModal).toBeVisible({ timeout: 10_000 });
    await expect(myAccountPage.newPasswordInput).toBeVisible();
    await expect(myAccountPage.confirmPasswordInput).toBeVisible();
    await expect(myAccountPage.recaptchaContainer).toBeVisible();
    await expect(myAccountPage.confirmResetButton).toBeVisible();
    await expect(myAccountPage.cancelResetButton).toBeVisible();
  });
});
