import { test, expect } from '../fixtures';
import { DashboardPage } from '../../pages/DashboardPage';
import { UpgradeAccountPage } from '../../pages/UpgradeAccountPage';
import { SwitchCoursePage } from '../../pages/SwitchCoursePage';
import { PaymentPage, ShopifyCheckoutPage } from '../../pages/PaymentPage';
import { createOnboardedStudent } from '../../utils/testUser';
import { TEST_CARDS } from '../../test-data/registrationData';

// Reference: Student sheet, TC-STU-013 "Paid student switches course and pays
// the fee". Starts from a fresh account rather than reusing a shared
// FIXTURE_ACCOUNTS tier, since switching a shared account's exam type would
// permanently mutate it for the other Upgrade specs that depend on its
// current PTE package (see package-tier-allowlist.spec.ts).
test.describe('Switch Course', () => {
  test('TC-STU-013: Paid student switches course and pays the fee', { tag: '@smoke' }, async ({ page }) => {
    test.setTimeout(180_000);

    await createOnboardedStudent(page, 'e2e.stu.switchcourse');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.dismissInfoModalIfPresent();

    // Become a paid PTE student first (Bronze) so there's a fee to pay when switching.
    const upgradeAccountPage = new UpgradeAccountPage(page);
    await upgradeAccountPage.goto();
    await upgradeAccountPage.upgradeToPackage('bronze');
    const upgradePaymentPage = new PaymentPage(page);
    await upgradePaymentPage.proceedToCheckout();
    const upgradeCheckoutPage = new ShopifyCheckoutPage(page);
    await upgradeCheckoutPage.completePayment(TEST_CARDS.approved.number, TEST_CARDS.approved.cvv);
    await page.getByText('Access Dashboard').waitFor({ state: 'visible', timeout: 60_000 });

    // Package activation is a known-slow async job (see paid-to-paid-upgrade.spec.ts).
    await page.waitForTimeout(30_000);

    await dashboardPage.gotoHome();
    await dashboardPage.dismissInfoModalIfPresent();
    await dashboardPage.goToSwitchCourse();

    const switchCoursePage = new SwitchCoursePage(page);
    await switchCoursePage.acknowledgeProgressWarning();
    await switchCoursePage.selectExamType('IELTS Academic');
    await switchCoursePage.chooseUpgrade(false);
    await switchCoursePage.convertCourseNow();

    // Unlike Upgrade/Extend, confirming "Convert Course Now!" navigates
    // straight to the Shopify checkout - there's no intermediate
    // E2Language-hosted Payment Information "Go to checkout" step here.
    await page.waitForURL(/e2-staging-store\.myshopify\.com/, { timeout: 30_000 });
    const checkoutPage = new ShopifyCheckoutPage(page);
    const checkoutTotal = await checkoutPage.getOrderTotal();
    expect(checkoutTotal).toBeTruthy();
    await checkoutPage.completePayment(TEST_CARDS.approved.number, TEST_CARDS.approved.cvv);

    // Expected result: the student pays the fee and lands on the new course's dashboard.
    await expect(page.getByText('Access Dashboard')).toBeVisible({ timeout: 60_000 });
  });
});
