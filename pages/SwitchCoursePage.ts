import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Student/ChangePackage - reached from the profile menu's "Switch My
 * Course" link, which first shows a "you'll lose progress" confirmation
 * dialog (Yes/Cancel) before landing here. Confirmed live end-to-end:
 * select exam type -> VIEW -> choose upgrade Yes/No -> CONVERT COURSE NOW!
 * -> ChangePackageConfirmation.
 */
export class SwitchCoursePage extends BasePage {
  readonly switchConfirmYesButton: Locator;
  readonly examTypeSelect: Locator;
  readonly viewButton: Locator;
  readonly upgradeNoRadio: Locator;
  readonly upgradeYesRadio: Locator;
  readonly convertCourseNowLink: Locator;
  readonly confirmationHeading: Locator;
  readonly goToClassroomLink: Locator;

  constructor(page: Page) {
    super(page);
    this.switchConfirmYesButton = page.locator('button', { hasText: 'YES' }).first();
    this.examTypeSelect = page.locator('#AvailableExamTypeCode');
    this.viewButton = page.locator('#btnView');
    this.upgradeNoRadio = page.locator('label[for="rbIsUpgrade0"]');
    this.upgradeYesRadio = page.locator('label[for="rbIsUpgrade1"]');
    this.convertCourseNowLink = page.locator('a', { hasText: 'CONVERT COURSE NOW' });
    this.confirmationHeading = page.getByRole('heading', { name: 'Thank You' });
    this.goToClassroomLink = page.locator('a', { hasText: 'GO TO CLASSROOM' });
  }

  /** Dismisses the "you'll lose progress" confirmation that appears right after clicking Switch My Course. */
  async acknowledgeProgressWarning(): Promise<void> {
    await this.switchConfirmYesButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(this.switchConfirmYesButton);
  }

  async selectExamType(label: string): Promise<void> {
    await this.examTypeSelect.waitFor({ state: 'visible', timeout: 10_000 });
    await this.examTypeSelect.selectOption({ label });
    await this.humanClick(this.viewButton);
  }

  async chooseUpgrade(wantsUpgrade: boolean): Promise<void> {
    const radio = wantsUpgrade ? this.upgradeYesRadio : this.upgradeNoRadio;
    await radio.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(radio);
  }

  async convertCourseNow(): Promise<void> {
    await this.humanClick(this.convertCourseNowLink);
  }
}
