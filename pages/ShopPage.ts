import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { STUDENT_APP_HOST } from '../test-data/registrationData';

/**
 * E2 Shop (#e2shop-menu nav item). Item cards don't have stable ids - the
 * "Tutorial" add-on (a single 45-min 1:1 session, distinct from the
 * "Tutorials - Bundle of 2/3" cards) is located by its title text, then its
 * "LEARN MORE" button by DOM order (the first one after that heading).
 * "LEARN MORE" opens a detail modal with its own "BUY NOW" link into the
 * standard Payment Information page.
 */
export class ShopPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoHome(): Promise<void> {
    await this.goto(`${STUDENT_APP_HOST}/Student/Home`);
  }

  itemLearnMoreButton(exactTitle: string): Locator {
    const heading = this.page.locator(`:text-is("${exactTitle}")`).first();
    return heading.locator(`xpath=following::button[contains(text(),"LEARN MORE")][1]`);
  }

  async openItemDetails(exactTitle: string): Promise<void> {
    await this.humanClick(this.itemLearnMoreButton(exactTitle));
  }

  async buyNow(): Promise<void> {
    const buyButton = this.page.locator('a:visible, button:visible').filter({ hasText: /buy now/i }).first();
    await buyButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(buyButton);
  }
}
