import { test, expect } from '../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { createOnboardedStudent } from '../../utils/testUser';
import { STUDENT_APP_HOST } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-001 / TC-STU-002 (Login & Authentication).
test.describe('Student Login', () => {
  test('TC-STU-001: Student logs in with valid credentials and lands on the dashboard', { tag: '@smoke' }, async ({ page }) => {
    // Registration's own auto-login isn't the login form under test, so a
    // fresh onboarded account is logged out first to exercise the real flow.
    const { email, password } = await createOnboardedStudent(page, 'e2e.stu.login');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();
    await dashboardPage.logout();

    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.login(email, password);

    await expect(async () => {
      expect(page.url()).toContain(`${STUDENT_APP_HOST}/Student/Home`);
    }).toPass({ timeout: 25_000 });
  });

  test('TC-STU-002: Student login fails with wrong credentials', { tag: '@regression' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.login('e2e.stu.invalid.login@mailinator.com', 'WrongPass!1');

    await expect(loginPage.errorBanner).toBeVisible({ timeout: 15_000 });
    expect(await loginPage.getErrorMessage()).toMatch(/wrong email or password/i);
    // Rejected login leaves the student on the B2C sign-in page, not any app host.
    expect(page.url()).toContain('auth-rcv2.e2language.com');
  });
});
