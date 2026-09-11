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

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.sendCodeButton = page.locator('#emailVerificationControl_but_send_code');
    this.confirmationArea = page.locator('#api');
    this.cancelButton = page.locator('#cancel');
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.humanType(this.emailInput, email);
    await this.humanClick(this.sendCodeButton);
  }

  async getConfirmationText(): Promise<string> {
    return (await this.confirmationArea.innerText()).replace(/\s+/g, ' ').trim();
  }
}
