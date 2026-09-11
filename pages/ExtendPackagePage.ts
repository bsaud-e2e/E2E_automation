import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The "Access Period Expired" modal (paid-package variant -
 * #paidPackageExpiredDialogPane) offers EXTEND ACCESS, which leads to
 * Student/AdditionalPackage - "Extend Package Duration" with a 1/2-week
 * select and a "Buy Now" link into the standard Payment Information page.
 * Confirmed live end-to-end for a genuinely-expired paid fixture account.
 */
export class ExtendPackagePage extends BasePage {
  readonly expiredModal: Locator;
  readonly extendAccessButton: Locator;
  readonly extensionPeriodSelect: Locator;
  readonly buyNowLink: Locator;
  readonly extendHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.expiredModal = page.locator('#paidPackageExpiredDialogPane');
    this.extendAccessButton = page.locator('#btn-extendaccess');
    this.extensionPeriodSelect = page.locator('#SelectedAddOns');
    this.buyNowLink = page.locator('a.btn-buy', { hasText: 'Buy Now' }).first();
    this.extendHeading = page.getByRole('heading', { name: 'Extend Package Duration' });
  }

  async openExtendFromExpiredModal(): Promise<void> {
    await this.expiredModal.waitFor({ state: 'visible', timeout: 15_000 });
    await this.humanClick(this.extendAccessButton);
    await this.extendHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Selects the extension period by its visible label, e.g. "1 Week" or "2 Weeks". */
  async selectExtensionPeriod(labelContains: string): Promise<void> {
    const value = await this.extensionPeriodSelect.evaluate((el, needle) => {
      const select = el as HTMLSelectElement;
      const option = Array.from(select.options).find((o) => o.text.includes(needle));
      return option?.value ?? null;
    }, labelContains);
    if (value === null) {
      throw new Error(`No extension period option contains "${labelContains}"`);
    }
    await this.extensionPeriodSelect.selectOption(value);
  }

  async buyNow(): Promise<void> {
    await this.humanClick(this.buyNowLink);
  }
}
