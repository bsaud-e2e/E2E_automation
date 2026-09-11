import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { createOnboardedStudent } from '../../utils/testUser';

// Reference: Student sheet, TC-STU-006 "New student completes onboarding".
test.describe('New Student Onboarding', () => {
  test('TC-STU-006: A new free student completes onboarding and sees their dashboard summary', async ({
    page,
  }) => {
    await createOnboardedStudent(page, 'e2e.stu.onboard');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    // Expected result: landing on Student/Home with a working "Getting
    // Started" checklist and a Study Pathway progress panel. Getting
    // Started renders inside a same-origin micro-frontend iframe
    // (azdopl-rc-microfrontend.e2language.com/onboarding?...), confirmed
    // live - Study Pathway renders directly in the host page.
    const onboardingFrame = page.frameLocator('iframe[src*="/onboarding"]');
    await expect(onboardingFrame.getByText('Getting Started')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Study Pathway')).toBeVisible({ timeout: 20_000 });
  });
});
