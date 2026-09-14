import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The "Online Classes" widget on Student/Home lists upcoming live class
 * instances directly (no separate navigation needed). Each instance has its
 * own "JOIN CLASS" link (`a.lc-joinBtn`), confirmed live to exist in the DOM
 * for every listed instance but stay `display:none` until that instance is
 * actually starting/in-progress - there's no separate "upcoming" vs
 * "joinable" list, just this same link toggling visible in a join window
 * around the scheduled start time.
 */
export class LiveClassPage extends BasePage {
  /** Only the JOIN CLASS link(s) currently in their join window (not display:none). */
  readonly joinableClassLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.joinableClassLinks = page.locator('a.lc-joinBtn:visible');
  }
}
