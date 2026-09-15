import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { RecordedClassesPage } from '../../pages/RecordedClassesPage';
import { POWER_TIER_ACCOUNT_POOL } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-STU-064 (Smoke)
// "Paid user watches a recorded class in the Watched tab" - renumbered
// from an earlier draft's TC-STU-069.
//
// Each account's recorded-class list is small and finite - rather than
// hardcoding a title, this picks whichever row is currently first in the
// Unwatched tab, and rather than depending on one single account (which
// eventually runs out of unwatched classes entirely, confirmed live
// 2026-09-10: 3 for 3 watched on the primary fixture), it tries every
// account in POWER_TIER_ACCOUNT_POOL in turn and uses the first one that
// still has something unwatched. Add more fallback accounts any time via
// FIXTURE_POWER_TIER_EMAIL_2/PASSWORD_2 (then _3, etc.) in .env - only
// skips (rather than faking a result) if every account in the pool is
// exhausted.
test.describe('Recorded Classes', () => {
  test('TC-STU-064: Paid student plays a recorded class and it moves to Watched', { tag: '@smoke' }, async ({ page }) => {
    test.setTimeout(60_000 * POWER_TIER_ACCOUNT_POOL.length);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const recordedClassesPage = new RecordedClassesPage(page);

    let topic: string | null = null;
    for (const account of POWER_TIER_ACCOUNT_POOL) {
      await loginPage.gotoLogin();
      await loginPage.loginAndWaitForRedirect(account.email, account.password);
      await dashboardPage.dismissInfoModalIfPresent();
      await dashboardPage.expandNavItem('ONLINE CLASSES');
      await dashboardPage.navItem('RECORDED CLASSES').click();

      const firstWatchLink = page.locator('a.videoPreview:visible').first();
      const hasUnwatched = await firstWatchLink.isVisible({ timeout: 10_000 }).catch(() => false);
      if (hasUnwatched) {
        topic = await firstWatchLink.getAttribute('data-video-name');
        break;
      }
      await dashboardPage.logout().catch(() => {});
    }

    test.skip(
      !topic,
      `No unwatched recorded class left on any of the ${POWER_TIER_ACCOUNT_POOL.length} account(s) in POWER_TIER_ACCOUNT_POOL - add a fresh fallback via FIXTURE_POWER_TIER_EMAIL_${POWER_TIER_ACCOUNT_POOL.length + 1} in .env.`
    );

    await recordedClassesPage.watch(topic!);

    // Expected result: the recording plays, and moves from Unwatched to
    // Watched. "Watch" opens a full-page player (confirmed by the topic
    // text and a play button); the underlying Unwatched grid is still
    // present behind it and confirms the row itself is gone.
    await expect(page.getByText(topic!, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(recordedClassesPage.rowByTopic(topic!)).toHaveCount(0, { timeout: 15_000 });
  });
});
