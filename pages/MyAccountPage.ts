import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The "My Account" page (loaded in-place on Student/Home via
 * DashboardPage.goToMyAccount()). "Account Settings" is a collapsible
 * section (href="#account-setting-collapse") that must be expanded before
 * its "Reset Password" button (#btnResetPassword) becomes clickable, which
 * opens the #changePasswordDialog modal.
 *
 * This modal's actual submission is gated by a real Google reCAPTCHA v2
 * checkbox - confirmed live it does not auto-pass for this suite's
 * automated browser (it surfaces a genuine image-solve challenge), so only
 * the modal's reachability/fields are covered here, not a full submit.
 * See the README's "Known findings" for the full writeup.
 */
export class MyAccountPage extends BasePage {
  readonly accountSettingsHeader: Locator;
  readonly resetPasswordTrigger: Locator;
  readonly changePasswordModal: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly recaptchaContainer: Locator;
  readonly confirmResetButton: Locator;
  readonly cancelResetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.accountSettingsHeader = page.locator('a[href="#account-setting-collapse"]');
    this.resetPasswordTrigger = page.locator('#btnResetPassword');
    this.changePasswordModal = page.locator('#changePasswordDialog');
    this.newPasswordInput = page.locator('#NewPassword');
    this.confirmPasswordInput = page.locator('#ConfirmPassword');
    this.recaptchaContainer = page.locator('#reset_captcha_container');
    this.confirmResetButton = page.locator('#btnConfirmResetPassword');
    this.cancelResetButton = page.locator('#btnResetPasswordCancel');
  }

  async expandAccountSettings(): Promise<void> {
    await this.accountSettingsHeader.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(this.accountSettingsHeader);
  }

  async openResetPasswordModal(): Promise<void> {
    await this.resetPasswordTrigger.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(this.resetPasswordTrigger);
  }
}
