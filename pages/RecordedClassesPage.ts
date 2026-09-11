import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Online Classes > Recorded Classes. An SPA panel (no distinct URL) with an
 * Unwatched/Watched tab pair; each row's "Watch" link opens an inline video
 * player and moves that row to the Watched tab. Confirmed live.
 */
export class RecordedClassesPage extends BasePage {
  readonly unwatchedTab: Locator;
  readonly watchedTab: Locator;

  constructor(page: Page) {
    super(page);
    this.unwatchedTab = page.locator('button, a').filter({ hasText: 'UNWATCHED' }).first();
    this.watchedTab = page.locator('button, a').filter({ hasText: 'WATCHED' }).first();
  }

  /**
   * Both the Unwatched and Watched grids exist in the DOM at once (only one
   * is shown depending on the active tab), so matches are scoped to
   * currently-visible rows only.
   */
  rowByTopic(topic: string): Locator {
    return this.page.locator('tr:visible', { hasText: topic });
  }

  async watch(topic: string): Promise<void> {
    const watchLink = this.rowByTopic(topic).locator('a.videoPreview:visible');
    await this.humanClick(watchLink);
  }
}
