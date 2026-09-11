import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { RecordedClassesPage } from '../../pages/RecordedClassesPage';
import { FIXTURE_ACCOUNTS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-069 "Paid student watches a recorded class".
//
// Uses the sheet's own paid fixture account. Its recorded-class list is
// small and finite - rather than hardcoding a title, this picks whichever
// row is currently first in the Unwatched tab. As of this suite's own runs
// (2026-09-10) that list is now fully depleted (3 for 3 watched: "Skill
// Building: Robots", "Azure FUnction - Video 1", "Study Strategy Workshop
// with Dr Anna and David") - the test correctly fails with a clear message
// until either new recordings are added for this account or it points at a
// different paid fixture.
test.describe('Recorded Classes', () => {
  test('TC-STU-069: Paid student plays a recorded class and it moves to Watched', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForRedirect(FIXTURE_ACCOUNTS.powerTier.email, FIXTURE_ACCOUNTS.powerTier.password);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();
    await dashboardPage.expandNavItem('ONLINE CLASSES');
    await dashboardPage.navItem('RECORDED CLASSES').click();

    const recordedClassesPage = new RecordedClassesPage(page);
    const firstWatchLink = page.locator('a.videoPreview:visible').first();
    await expect(firstWatchLink, 'expected at least one unwatched recorded class in this fixture account').toBeVisible(
      { timeout: 15_000 }
    );
    const topic = await firstWatchLink.getAttribute('data-video-name');
    expect(topic).toBeTruthy();

    await recordedClassesPage.watch(topic!);

    // Expected result: the recording plays, and moves from Unwatched to
    // Watched. "Watch" opens a full-page player (confirmed by the topic
    // text and a play button); the underlying Unwatched grid is still
    // present behind it and confirms the row itself is gone.
    await expect(page.getByText(topic!, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(recordedClassesPage.rowByTopic(topic!)).toHaveCount(0, { timeout: 15_000 });
  });
});
