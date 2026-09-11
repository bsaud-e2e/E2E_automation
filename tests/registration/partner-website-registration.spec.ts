import { test, expect } from '../fixtures';

// Reference: Student sheet, TC-STU-035 "Registering via a partner's website
// reaches the normal sign-up flow". Uses the Genepool organization voucher
// URL from the sheet's own Test Data. Confirmed live: with no active
// session, this URL immediately shows a "Please log in to see the packages
// and pricing related to you" modal (not a full package browse-then-upgrade
// flow) - clicking "SIGN UP" there is what leads into the standard
// Registration flow.
test.describe('Partner Website Registration', () => {
  test("TC-STU-035: Registering via a partner organization's voucher link reaches the standard sign-up flow", async ({
    page,
  }) => {
    await page.goto('https://azdopl-rc-main.e2language.com/Registration/UpgradeAccountWithCode?code=GP001-bZbC-01', {
      waitUntil: 'domcontentloaded',
    });

    const signUpButton = page.locator('#signupBtn');
    await expect(signUpButton).toBeVisible({ timeout: 15_000 });
    await signUpButton.click();

    // Expected result: leads into the same standard Paid Sign Up flow as any other entry point.
    await expect(page).toHaveURL(/\/Registration(\/|$|\?)/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Which Test Are You Taking/i })).toBeVisible({ timeout: 15_000 });
  });
});
