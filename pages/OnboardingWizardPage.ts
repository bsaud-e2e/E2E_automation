import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The Free-registration onboarding wizard (Welcome -> About You -> Skills ->
 * Your Future, at /Registration/PostFreeRegistration) gates access to
 * Student/Home until every step's required fields are filled. The specific
 * answers don't matter for test-account setup - only reaching the dashboard
 * does - so every step is filled generically:
 *  - <select> fields: the first real option (index 1, skipping the
 *    placeholder - some placeholders use a non-empty value like "0", so an
 *    empty-string check isn't reliable).
 *  - radio groups: the last option in each group (keeps the branch simple,
 *    e.g. "NOT BOOKED YET" / "NO", avoiding conditional follow-up fields
 *    revealed by other answers).
 *  - checkboxes: checked if present (e.g. "Sync with calendar").
 *  - the "destination country" field on the final step is a custom
 *    checkbox-dropdown widget, not a native <select>, and needs its own
 *    open/pick/close handling.
 * Confirmed live end-to-end against azdopl-rc-registrationapp.e2language.com.
 */
export class OnboardingWizardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private async fillFirstRealOptionInVisibleSelects(): Promise<void> {
    const selects = this.page.locator('select:visible');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);
      const value = await select.evaluate((el) =>
        (el as HTMLSelectElement).options.length > 1 ? (el as HTMLSelectElement).options[1].value : null
      );
      if (value !== null) {
        await select.selectOption(value).catch(() => {});
      }
    }
  }

  private async pickLastRadioInEveryVisibleGroup(): Promise<void> {
    const groupedIds = await this.page.evaluate(() => {
      const byName: Record<string, string[]> = {};
      document.querySelectorAll('input[type=radio]').forEach((node) => {
        const input = node as HTMLInputElement;
        const rect = input.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        (byName[input.name] ??= []).push(input.id);
      });
      return byName;
    });

    for (const name of Object.keys(groupedIds)) {
      const ids = groupedIds[name];
      const lastId = ids[ids.length - 1];
      const label = this.page.locator(`label[for="${lastId}"]`);
      if ((await label.count()) > 0) {
        await this.humanClick(label.first());
      } else {
        await this.humanClick(this.page.locator(`#${lastId}`));
      }
    }
  }

  private async checkVisibleUncheckedCheckboxes(): Promise<void> {
    const boxes = this.page.locator('input[type=checkbox]:visible:not(:checked)');
    const count = await boxes.count();
    for (let i = 0; i < count; i++) {
      await this.humanClick(boxes.nth(i)).catch(() => {});
    }
  }

  private async clickStepAdvanceButton(): Promise<boolean> {
    const buttons = this.page.locator('button:visible');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const label = (await button.innerText().catch(() => '')).trim().toUpperCase();
      if (['NEXT', 'SUBMIT', 'FINISH', 'DONE'].some((keyword) => label.includes(keyword))) {
        await this.humanClick(button);
        return true;
      }
    }
    return false;
  }

  /** Opens the "destination country" checkbox-dropdown and picks the first option. */
  private async pickFirstDestinationCountryIfPresent(): Promise<void> {
    const toggle = this.page.locator('.dropdown-toggle').first();
    if (!(await toggle.isVisible().catch(() => false))) return;

    await toggle.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
    const firstOption = this.page
      .locator('.dropdown-menu input[type=checkbox], .multi-select-checkbox input[type=checkbox]')
      .first();
    if ((await firstOption.count()) > 0) {
      await firstOption.click({ force: true }).catch(() => {});
    }
    // Escape closes the dropdown without risking a stray click landing on
    // unrelated chrome (e.g. the site logo, which resets the whole wizard).
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async complete(): Promise<void> {
    for (let step = 0; step < 3; step++) {
      await this.page.waitForTimeout(1_000);
      await this.fillFirstRealOptionInVisibleSelects();
      await this.pickLastRadioInEveryVisibleGroup();
      await this.checkVisibleUncheckedCheckboxes();
      // Picking a radio can reveal a new required select within the same
      // step, so fill again before advancing.
      await this.fillFirstRealOptionInVisibleSelects();
      await this.clickStepAdvanceButton();
    }

    await this.page.waitForTimeout(1_500);
    await this.fillFirstRealOptionInVisibleSelects();
    await this.pickFirstDestinationCountryIfPresent();
    await this.clickStepAdvanceButton();

    await this.page.waitForURL('**/Student/Home**', { timeout: 20_000 });
  }
}
