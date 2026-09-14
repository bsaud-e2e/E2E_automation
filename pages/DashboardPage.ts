import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { STUDENT_APP_HOST } from '../test-data/registrationData';

/**
 * Student/Home dashboard. The profile dropdown's display name varies per
 * account, so both the menu toggle and the logout link are located off the
 * logout link's real id (#logout) rather than any name text.
 */
export class DashboardPage extends BasePage {
  readonly profileMenuToggle: Locator;
  readonly logoutLink: Locator;
  readonly infoModalCloseButton: Locator;
  readonly upgradeLink: Locator;
  readonly switchCourseLink: Locator;
  readonly shopNavItem: Locator;
  readonly myAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    this.logoutLink = page.locator('#logout');
    this.profileMenuToggle = page.locator('li:has(#logout) > a.dropdown-toggle');
    // First-visit "How To Use" video modal (and similar dismissible info
    // dialogs) block interaction with the nav until closed.
    this.infoModalCloseButton = page.locator('.modal:visible button:has-text("Close")').first();
    this.upgradeLink = page.locator('a.upgrade-account-menu').first();
    this.switchCourseLink = page.locator('li:has(#logout) a', { hasText: 'Switch My Course' });
    this.shopNavItem = page.locator('#e2shop-menu');
    this.myAccountLink = page.locator('a.my-account-menu');
  }

  async gotoHome(): Promise<void> {
    await this.goto(`${STUDENT_APP_HOST}/Student/Home`);
  }

  async dismissInfoModalIfPresent(): Promise<void> {
    if (await this.infoModalCloseButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.infoModalCloseButton.click({ force: true }).catch(() => {});
    }
  }

  async logout(): Promise<void> {
    await this.humanClick(this.profileMenuToggle);
    await this.logoutLink.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(this.logoutLink);
  }

  /**
   * Top-level nav items (Course Materials, Assessments, Online Classes, ...)
   * are click-to-expand submenu toggles, not direct links - clicking reveals
   * a submenu of real links rather than navigating anywhere itself.
   */
  navItem(label: string): Locator {
    return this.page.locator('a', { hasText: label }).first();
  }

  async expandNavItem(label: string): Promise<void> {
    await this.humanClick(this.navItem(label));
  }

  async goToSwitchCourse(): Promise<void> {
    await this.humanClick(this.profileMenuToggle);
    await this.switchCourseLink.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(this.switchCourseLink);
  }

  async goToShop(): Promise<void> {
    await this.humanClick(this.shopNavItem);
  }

  async goToMyAccount(): Promise<void> {
    await this.humanClick(this.profileMenuToggle);
    await this.myAccountLink.waitFor({ state: 'visible', timeout: 10_000 });
    await this.humanClick(this.myAccountLink);
  }
}
