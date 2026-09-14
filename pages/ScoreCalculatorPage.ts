import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { STUDENT_APP_HOST } from '../test-data/registrationData';

/**
 * /Student/ScoreCalculator (Score Calculator V2). Confirmed live end-to-end,
 * including the Speaking/Read-Aloud questions that TC-STU-072 documents as
 * blocked in a plain automation environment - launching Chromium with
 * --use-fake-device-for-media-stream and granting the microphone permission
 * (see playwright.config.ts) makes the RECORD/STOP widget's MediaRecorder
 * produce real (silent) audio, which is enough for the app to accept it.
 *
 * The flow is a single-page app with no distinct URL per step: START ->
 * System Requirement Checker (an audio-clarity check, a recorder-widget
 * check, both Yes/No, then a "fulfilled" screen) -> a flat sequence of
 * ~24 questions covering Listening/Reading/Writing/Speaking together (PTE;
 * other exam types may have a different count/order) -> a completion
 * screen -> the score report.
 */
export class ScoreCalculatorPage extends BasePage {
  readonly startPlacementTestButton: Locator;
  readonly seeYourResultsLink: Locator;
  /** The score report renders inside an <iframe> (matches the V1 report's iframe#plt-frame pattern), not the top-level page. */
  readonly resultHeading: Locator;
  readonly overallScoreHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.startPlacementTestButton = page.locator('#start-placement-test');
    this.seeYourResultsLink = page.locator('button:visible, a:visible', { hasText: /SEE YOUR RESULTS/i }).first();
    const resultFrame = page.frameLocator('iframe');
    this.resultHeading = resultFrame.getByRole('heading', { name: 'Score Calculator Result' });
    this.overallScoreHeading = resultFrame.getByText('Your Overall Score');
  }

  async goto(): Promise<void> {
    await super.goto(`${STUDENT_APP_HOST}/Student/ScoreCalculator`);
  }

  async startPlacementTest(): Promise<void> {
    await this.humanClick(this.startPlacementTestButton);
    await this.waitForLoadingOverlayToClear();
    // The System Requirement Checker's own "Start" button reuses the same
    // accessible name as the landing screen's - role-based matching (not
    // CSS-visibility-based) since this transition is sometimes slow and the
    // underlying widget re-renders during it.
    const startTestButton = this.page.getByRole('button', { name: /^start$/i }).first();
    await startTestButton.waitFor({ state: 'visible', timeout: 30_000 });
    await this.humanClick(startTestButton);
  }

  private async waitForLoadingOverlayToClear(): Promise<void> {
    const overlay = this.page.locator('#loadingDialogPane');
    if ((await overlay.count()) > 0) {
      await overlay.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }
  }

  /** Answers the audio-clarity / recorder-widget Yes-No checks and advances past the "fulfilled" screen. */
  async completeSystemRequirementChecker(): Promise<void> {
    for (let i = 0; i < 6; i++) {
      await this.waitForLoadingOverlayToClear();
      const yesButton = this.page.locator('button:visible', { hasText: 'YES' }).first();
      if ((await yesButton.count()) > 0) {
        await this.humanClick(yesButton);
        await this.page.waitForTimeout(2_000);
        continue;
      }
      const nextButton = this.page.locator('button:visible, a:visible', { hasText: /NEXT/i }).first();
      if ((await nextButton.count()) > 0) {
        await this.humanClick(nextButton);
        return;
      }
      break;
    }
  }

  /**
   * Answers whatever question widget is currently on screen, generically -
   * the specific widget kind (MCSA/MCMA radio-or-checkbox, a live
   * RECORD/STOP speaking recording, an essay textarea, or dropdown-based
   * fill-in-the-blank selects) doesn't matter for this test, only that the
   * question becomes answered so NEXT/Submit enables. Returns whether
   * anything was actually answered.
   */
  private async answerCurrentQuestion(): Promise<boolean> {
    await this.waitForLoadingOverlayToClear();

    // Live-recording Speaking/Read-Aloud widget.
    const recordButton = this.page.locator('button:visible', { hasText: /RECORD/i }).first();
    if ((await recordButton.count()) > 0) {
      await this.humanClick(recordButton);
      await this.page.waitForTimeout(4_000); // let the fake device "record" a few seconds
      const stopButton = this.page.locator('button:visible', { hasText: /STOP/i }).first();
      if ((await stopButton.count()) > 0) {
        await this.humanClick(stopButton);
        await this.page.waitForTimeout(1_500);
      }
      return true;
    }

    let answered = false;

    // Dropdown-based fill-in-the-blank (one <select> per gap).
    const selects = this.page.locator('select:visible');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      if (!(await select.inputValue().catch(() => ''))) {
        const value = await select.evaluate((el) =>
          (el as HTMLSelectElement).options.length > 1 ? (el as HTMLSelectElement).options[1].value : null
        );
        if (value !== null) {
          await select.selectOption(value).catch(() => {});
          answered = true;
        }
      }
    }

    // Ordinary visible radio/checkbox (MCSA/MCMA/TC).
    for (const selector of ['input[type=radio]:visible', 'input[type=checkbox]:visible']) {
      const inputs = this.page.locator(selector);
      if ((await inputs.count()) > 0) {
        await this.humanClick(inputs.first());
        answered = true;
      }
    }

    // Hidden-input pattern (radio/checkbox present but width/height 0, a
    // styled label/td is the real click target) - confirmed on some
    // multi-select/matrix question layouts.
    if (!answered) {
      for (const type of ['radio', 'checkbox']) {
        const hidden = this.page.locator(`input[type=${type}]`);
        if ((await hidden.count()) > 0) {
          const id = await hidden.first().getAttribute('id').catch(() => null);
          const label = id ? this.page.locator(`label[for="${id}"]`) : null;
          if (label && (await label.count()) > 0) {
            await this.humanClick(label.first());
          } else {
            await hidden
              .first()
              .evaluate((el) => {
                (el as HTMLInputElement).checked = true;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('click', { bubbles: true }));
              })
              .catch(() => {});
          }
          answered = true;
        }
      }
    }

    // Essay / long-form writing.
    const textarea = this.page.locator('textarea:visible').first();
    if ((await textarea.count()) > 0 && (await textarea.inputValue().catch(() => '')).trim().length < 50) {
      const words = Array.from({ length: 140 }, (_, i) => `sample${i}`).join(' ');
      await textarea.click();
      await this.page.keyboard.type(words, { delay: 2 });
      answered = true;
    }

    // Short fill-in-the-blank text inputs.
    const textInputs = this.page.locator('input[type=text]:visible');
    const textInputCount = await textInputs.count();
    for (let i = 0; i < textInputCount; i++) {
      const input = textInputs.nth(i);
      if (!(await input.inputValue().catch(() => ''))) {
        await input.click();
        await this.page.keyboard.type('answer', { delay: 20 });
        answered = true;
      }
    }

    return answered;
  }

  /**
   * Answers every remaining question and advances through the whole test,
   * including the final Submit - the same "advance" button that answering
   * the last question enables is the Submit button itself, so there's no
   * separate submit step to call afterward. maxQuestions caps the loop
   * generously above PTE's observed ~24-question flow so a genuinely
   * stuck/unanswerable widget still fails fast instead of hanging.
   */
  async completeAndSubmitAllQuestions(maxQuestions = 40): Promise<void> {
    for (let i = 0; i < maxQuestions; i++) {
      await this.waitForLoadingOverlayToClear();

      await this.answerCurrentQuestion();

      const advanceButton = this.page.locator('button:visible, a:visible', { hasText: /NEXT|SUBMIT/i }).first();
      if ((await advanceButton.count()) === 0) {
        return; // reached a screen with no advance/submit control (e.g. already on the completion screen).
      }
      if (await advanceButton.isDisabled().catch(() => false)) {
        return; // current question didn't actually get answered - stop rather than loop forever.
      }
      await this.humanClick(advanceButton);
      await this.page.waitForTimeout(1_500);
    }
  }

  async viewResults(): Promise<void> {
    await this.humanClick(this.seeYourResultsLink);
  }
}
