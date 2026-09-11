import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LOGIN_HOST } from '../test-data/registrationData';

/**
 * Shared Azure AD B2C login page used by Admin, Teacher and Student roles alike
 * (confirmed live: https://azdopl-rc-adminapp.e2language.com/Account/Login).
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#signInName');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#next');
    this.signUpLink = page.locator('#signUpBtn');
    this.forgotPasswordLink = page.locator('#forgotPassword');
    // Confirmed live: <div class="error pageLevel" role="alert"><p>Wrong email or password</p></div>
    this.errorBanner = page.locator('.error.pageLevel[role="alert"]');
  }

  async gotoLogin(): Promise<void> {
    await this.goto(`${LOGIN_HOST}/Account/Login`);
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.humanType(this.emailInput, email);
    await this.humanType(this.passwordInput, password);
    await this.humanClick(this.loginButton);
  }

  /** Logs in and waits for the post-login redirect chain to settle - this can take well over 10s. */
  async loginAndWaitForRedirect(email: string, password: string, timeout = 25_000): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL(/e2language\.com\/(Student|Registration)/, { timeout });
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.waitFor({ state: 'visible' });
    await this.humanClick(this.forgotPasswordLink);
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorBanner.innerText()).trim();
  }
}
