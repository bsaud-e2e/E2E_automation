import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  get currentUrl(): string {
    return this.page.url();
  }

  /**
   * signup.e2language.com runs behavioral bot detection that silently drops
   * the final form submission when fields are populated via Locator.fill()
   * (no per-keystroke events) - confirmed live: identical requests succeed
   * only when driven through real mouse movement and keyboard.type(). Every
   * page interaction goes through these two helpers for that reason.
   */
  protected async humanType(locator: Locator, text: string): Promise<void> {
    await this.humanClick(locator);
    // Clears any pre-filled value first (e.g. Shopify's saved-address
    // autofill on a second purchase in the same session) - confirmed live
    // that typing without this appends onto existing content instead of
    // replacing it.
    await locator.press('ControlOrMeta+A');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(text, { delay: 20 });
  }

  protected async humanClick(locator: Locator): Promise<void> {
    const box = await locator.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    }
    await locator.click();
  }
}
