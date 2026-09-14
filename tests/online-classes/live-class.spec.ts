import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { LiveClassPage } from '../../pages/LiveClassPage';
import { FIXTURE_ACCOUNTS } from '../../test-data/registrationData';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-STU-062 (Smoke)
// "Join a live class from the Dashboard". Confirmed live (2026-09-15,
// PTE Power fixture account) that a recurring live class now exists on
// this account's dashboard and its JOIN CLASS link (a.lc-joinBtn) is
// genuinely present in the DOM - but it only becomes visible in a join
// window around each instance's actual scheduled start time, all of
// which were in the future (16 Sep onward) at time of writing, so the
// full join flow (does it open Zoom in a new tab) couldn't be observed
// live. Rather than assert on unverified behavior, this test only
// proceeds through the actual join click if an instance happens to be in
// its join window when the suite runs; otherwise it skips with a clear
// reason instead of faking a result - same pattern as the
// expiredFreeTrial fixture's one-time-survey handling.
test.describe('Live Class', () => {
  test('TC-STU-062: Student joins a live class from the Dashboard', { tag: '@smoke' }, async ({ page, context }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();
    await page.waitForTimeout(3000);

    const liveClassPage = new LiveClassPage(page);
    const joinableCount = await liveClassPage.joinableClassLinks.count();
    test.skip(
      joinableCount === 0,
      'No scheduled live class instance is currently in its join window (the JOIN CLASS link only becomes visible around the actual start time) - nothing to join right now.'
    );

    const newPagePromise = context.waitForEvent('page', { timeout: 15_000 });
    await liveClassPage.joinableClassLinks.first().click();

    // Expected result: per confirmed architecture, Live Class delivery is
    // Zoom-based - assert the redirect/URL only, not specific in-meeting UI.
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toMatch(/zoom\.us/i);
  });
});
