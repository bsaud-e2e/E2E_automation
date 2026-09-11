import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { STUDENT_APP_HOST } from '../test-data/registrationData';

/**
 * /Registration/UpgradeAccount - lists package cards (class "package-item",
 * each with an h3 whose class is the lowercased/dashed package slug, e.g.
 * h3.express, h3.expressplus) with an "UPGRADE" link that leads to the
 * Payment Information page. Confirmed live: a blocked tier for the account's
 * current package doesn't render a card/UPGRADE link at all for that tier.
 */
export class UpgradeAccountPage extends BasePage {
  readonly upgradeHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.upgradeHeading = page.locator('h2', { hasText: 'Upgrade' });
  }

  async goto(): Promise<void> {
    await super.goto(`${STUDENT_APP_HOST}/Registration/UpgradeAccount`);
  }

  /** Card for a given package, keyed by its h3 class slug (e.g. "express", "expressplus", "silver", "gold"). */
  packageCard(slug: string): Locator {
    return this.page.locator('.package-item', { has: this.page.locator(`h3.${slug}`) });
  }

  async isPackageOffered(slug: string): Promise<boolean> {
    return (await this.packageCard(slug).count()) > 0;
  }

  async upgradeToPackage(slug: string): Promise<void> {
    const card = this.packageCard(slug);
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    await this.humanClick(card.locator('a', { hasText: 'UPGRADE' }).first());
  }
}
