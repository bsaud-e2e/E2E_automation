import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { REGISTRATION_HOST } from '../test-data/registrationData';

/**
 * Covers the shared "StudentDataForm" registration flow used by both entry points:
 *  - Free Sign Up:  /Registration/Free?examTypeCode=<code>
 *  - Paid Sign Up:  /Registration/SignUp?examTypeCode=<code>&packageCode=<code>
 * Both render the same field ids and step behaviour (email first, then
 * name/password revealed in place after the first "Continue" click) -
 * confirmed by inspecting the live DOM on both entry points.
 */
export class RegistrationPage extends BasePage {
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly passwordInput: Locator;
  readonly continueButton: Locator;
  readonly fieldValidationErrors: Locator;
  readonly accountExistsGoToLoginButton: Locator;
  readonly correctDetailsConfirmButton: Locator;
  readonly errorDialog: Locator;
  readonly errorDialogMessage: Locator;
  readonly errorDialogCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#EmailAddress');
    this.firstNameInput = page.locator('#FirstName');
    this.lastNameInput = page.locator('#LastName');
    this.passwordInput = page.locator('#Password');
    this.continueButton = page.locator('#saveRegistrationBtn');
    this.fieldValidationErrors = page.locator('.error-container label.error');
    this.accountExistsGoToLoginButton = page.locator('#studentExistBtn');
    this.correctDetailsConfirmButton = page.locator('#correct-btn, #studentContinueBtn');
    // Server-side rejections (blocked email domain, validation failures)
    // surface as this modal rather than inline field errors - confirmed live
    // for a blocked domain: "An error occurred while validating the email
    // address. Please reload the page and try again."
    this.errorDialog = page.locator('#errorDialogPane');
    this.errorDialogMessage = page.locator('#errorPaneSection');
    this.errorDialogCloseButton = this.errorDialog.locator('button', { hasText: 'Close' });
  }

  async gotoFreeRegistration(examTypeCode: string): Promise<void> {
    await this.goto(`${REGISTRATION_HOST}/Registration/Free?examTypeCode=${examTypeCode}`);
  }

  async gotoPaidRegistration(examTypeCode: string, packageCode: string): Promise<void> {
    await this.goto(
      `${REGISTRATION_HOST}/Registration/SignUp?examTypeCode=${examTypeCode}&packageCode=${packageCode}`
    );
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.humanType(this.emailInput, email);
  }

  /** Clicks the shared "Continue/Next" button that advances step 1 (email) to step 2 (name/password). */
  async proceedToPersonalDetails(): Promise<void> {
    await this.humanClick(this.continueButton);
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async fillPersonalDetails(firstName: string, lastName: string, password?: string): Promise<void> {
    await this.humanType(this.firstNameInput, firstName);
    await this.humanType(this.lastNameInput, lastName);
    if (password !== undefined && (await this.passwordInput.isVisible().catch(() => false))) {
      await this.humanType(this.passwordInput, password);
    }
  }

  /** Submits the current step (same button drives both the step transition and the final submit). */
  async submit(): Promise<void> {
    await this.humanClick(this.continueButton);
  }

  async getValidationErrors(): Promise<string[]> {
    const texts = await this.fieldValidationErrors.allInnerTexts();
    return texts.map((t) => t.trim()).filter(Boolean);
  }

  /**
   * jQuery Validate toggles the email input's class between "valid" and
   * "error" as its authoritative pass/fail signal - clicking Continue reveals
   * the next step's fields regardless of validity, so field visibility alone
   * cannot be used to detect a rejected email.
   */
  async isEmailFieldFlaggedInvalid(): Promise<boolean> {
    const classAttr = (await this.emailInput.getAttribute('class')) ?? '';
    return classAttr.split(/\s+/).includes('error');
  }

  async goToLoginFromAccountExistsPrompt(): Promise<void> {
    await this.humanClick(this.accountExistsGoToLoginButton);
  }
}
