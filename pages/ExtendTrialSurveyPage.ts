import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The "Extend Trial" 4-question survey (POST /Survey/SubmitExtendTrial),
 * reached from the free-trial-expired modal's "Extend Trial" link
 * (#extendTrialLink, data-url="/Survey/ExtendTrial"). Confirmed live: a
 * fixed sequence of questions 34 (text), 35 (radio - includes the
 * "Financial constraints" branch, data-answer-id 163), 36 (text), 37 (text)
 * -> Submit. Selecting "Financial constraints" on Q35 surfaces the
 * #financialupgradeModal voucher offer instead of the plain "Trial
 * Extended" success screen; any other answer leads to "Trial Extended".
 */
export class ExtendTrialSurveyPage extends BasePage {
  readonly expiredModal: Locator;
  readonly extendTrialLink: Locator;
  readonly startButton: Locator;
  readonly financialConstraintsRadio: Locator;
  readonly trialExtendedHeading: Locator;
  readonly financialUpgradeModal: Locator;

  constructor(page: Page) {
    super(page);
    this.expiredModal = page.locator('#freePackageExpiredDialogPane');
    this.extendTrialLink = page.locator('#extendTrialLink');
    this.startButton = page.locator('#btn_start');
    this.financialConstraintsRadio = page.locator('[data-answer-id="163"][type="radio"]');
    this.trialExtendedHeading = page.getByRole('heading', { name: 'Trial Extended' });
    this.financialUpgradeModal = page.locator('#financialupgradeModal');
  }

  async openFromExpiredModal(): Promise<void> {
    await this.expiredModal.waitFor({ state: 'visible', timeout: 15_000 });
    await this.humanClick(this.extendTrialLink);
    await this.startButton.waitFor({ state: 'visible', timeout: 15_000 });
  }

  private async answerTextQuestion(questionId: number): Promise<void> {
    const input = this.page.locator(`.answer_survey_${questionId}[type="text"]`).first();
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanType(input, 'Automated QA response');
    await this.humanClick(this.page.locator(`#btn_next_survey_${questionId}`));
  }

  /**
   * Runs the full 4-question survey. financialConstraint selects the
   * "Financial constraints" radio on Q35 (TC-STU-018's branch); otherwise
   * the first non-financial radio option is used (TC-STU-017's branch).
   */
  async completeSurvey(financialConstraint: boolean): Promise<void> {
    await this.humanClick(this.startButton);
    await this.answerTextQuestion(34);

    const radio = financialConstraint
      ? this.financialConstraintsRadio
      : this.page.locator('[data-answer-id="159"][type="radio"]');
    await radio.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(radio);
    await this.humanClick(this.page.locator('#btn_next_survey_35'));

    await this.answerTextQuestion(36);

    const lastInput = this.page.locator('.answer_survey_37[type="text"]').first();
    await lastInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanType(lastInput, 'Automated QA response');
    await this.humanClick(this.page.locator('#btnSubmit'));
  }
}
