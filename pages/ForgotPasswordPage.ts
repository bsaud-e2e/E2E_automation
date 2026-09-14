import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The Azure B2C "forgot password" claims-exchange flow, reached via
 * LoginPage.clickForgotPassword(). Confirmed live: submitting either a
 * registered or unregistered email renders the identical confirmation
 * message below - the field ids come from B2C's own generated markup, not
 * anything E2Language-specific.
 */
export class ForgotPasswordPage extends BasePage {
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly confirmationArea: Locator;
  readonly cancelButton: Locator;
  readonly verificationCodeInput: Locator;
  readonly verifyCodeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.sendCodeButton = page.locator('#emailVerificationControl_but_send_code');
    this.confirmationArea = page.locator('#api');
    this.cancelButton = page.locator('#cancel');
    this.verificationCodeInput = page.locator('#VerificationCode');
    this.verifyCodeButton = page.locator('#emailVerificationControl_but_verify_code');
  }

  /**
   * "Send verification code" and "Verify code" each hit their own distinct
   * action under B2C's SelfAsserted/DisplayControlAction endpoint -
   * confirmed live via network capture:
   *   .../DisplayControlAction/vbeta/emailVerificationControl/SendCode
   *   .../DisplayControlAction/vbeta/emailVerificationControl/VerifyCode
   * Both always answer HTTP 200 at the transport layer (even for a
   * rejected/wrong code); the real result is the JSON body's own "status"
   * field (e.g. "200" on success), so that's what callers should check
   * rather than the HTTP status alone.
   */
  private waitForSendCodeAction() {
    return this.page.waitForResponse((res) => res.url().includes('emailVerificationControl/SendCode'));
  }

  private waitForVerifyCodeAction() {
    return this.page.waitForResponse((res) => res.url().includes('emailVerificationControl/VerifyCode'));
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.humanType(this.emailInput, email);
    await this.humanClick(this.sendCodeButton);
  }

  /** Same as requestReset(), but resolves with the SendCode API call's parsed JSON body. */
  async requestResetAndGetApiResult(email: string): Promise<{ status: string }> {
    const responsePromise = this.waitForSendCodeAction();
    await this.requestReset(email);
    const response = await responsePromise;
    return response.json();
  }

  async getConfirmationText(): Promise<string> {
    return (await this.confirmationArea.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Enters the emailed 6-digit OTP into the "Secondary Verification Code"
   * field and clicks Verify code - confirmed live: this enables the
   * Continue button for the rest of the reset flow.
   */
  async enterAndVerifyCode(code: string): Promise<void> {
    await this.verificationCodeInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanType(this.verificationCodeInput, code);
    await this.humanClick(this.verifyCodeButton);
  }

  /** Same as enterAndVerifyCode(), but resolves with the VerifyCode API call's parsed JSON body. */
  async enterAndVerifyCodeGetApiResult(code: string): Promise<{ status: string }> {
    const responsePromise = this.waitForVerifyCodeAction();
    await this.enterAndVerifyCode(code);
    const response = await responsePromise;
    return response.json();
  }
}
