import { FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The Student/Home dashboard's Study Pathway widget - a cross-origin
 * microfrontend iframe (#studentPathwayMicrofrontend, served from
 * azdopl-rc-microfrontend.e2language.com). Confirmed live for a PTE
 * account: it renders one collapsible skill-category panel per module
 * (Speaking/Writing/Reading/Listening, each tagged "<Skill> Essential" with
 * a "N% Completed" progress indicator), not the sheet's originally-assumed
 * 5-row/8-button layout - that gap-analysis test case (source ref
 * ACT-S1/S2/S4) was written before this widget's real PTE layout was
 * inspected live, so these selectors target what's actually rendered.
 * There is exactly one Info Modal button, in the widget's own header (not
 * per activity-set).
 */
export class StudyPathwayWidgetPage extends BasePage {
  readonly widgetIframe: Locator;
  readonly frame: FrameLocator;
  readonly scoreCalculatorMenuItem: Locator;
  readonly infoModalButton: Locator;
  readonly infoModalDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.widgetIframe = page.locator('#studentPathwayMicrofrontend');
    this.frame = page.frameLocator('#studentPathwayMicrofrontend');
    this.scoreCalculatorMenuItem = page.locator('#score-estimator-menu');
    this.infoModalButton = this.frame.locator('i[aria-label="Info Modal"]');
    // Confirmed live: this is a video-intro modal titled "Study Pathway"
    // with a CLOSE button, not the differently-named myProgressHistoryDialog.
    this.infoModalDialog = page.locator('.modal.in', { hasText: 'Study Pathway' });
  }

  async waitForLoaded(): Promise<void> {
    await this.widgetIframe.waitFor({ state: 'visible', timeout: 20_000 });
    await this.frame.locator('.panel-heading.title.main-heading', { hasText: 'Study Pathway' }).waitFor({
      state: 'visible',
      timeout: 20_000,
    });
  }

  /** The skill-category panel headers, e.g. "Speaking Essential 42% Completed". */
  skillCategoryHeaders(): Locator {
    return this.frame.locator('a[aria-label*="Essential"][aria-label*="% Completed"]');
  }

  async openInfoModal(): Promise<void> {
    await this.infoModalButton.scrollIntoViewIfNeeded();
    await this.infoModalButton.click({ force: true });
  }

  async closeInfoModal(): Promise<void> {
    await this.infoModalDialog.locator('button', { hasText: /close/i }).first().click();
  }
}
