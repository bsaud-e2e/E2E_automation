/**
 * Reference data sourced from E2Language_E2E_Test_Case_Suite_v8_Student_Executed.xlsx
 * - "Student" sheet: TC-STU-007, TC-STU-008, TC-STU-009, TC-STU-010
 * - "Credentials & Test Data" sheet
 * - "Dashboard & Environment URLs" sheet
 */

// Confirmed staging registration host (2026-09-09 sheet update). The
// previously-used signup.e2language.com hands off into app.e2language.com /
// www.e2language.com, which the sheet documents as PRODUCTION hostnames -
// azdopl-rc-registrationapp.e2language.com follows the same azdopl-rc-*
// naming convention as the confirmed-staging admin/teacher/student hosts and
// is what TC-STU-007/TC-STU-008 now record as passing against.
export const REGISTRATION_HOST = 'https://azdopl-rc-registrationapp.e2language.com';

// Shared Azure AD B2C-authenticated host (Admin + Teacher land here by role;
// Student is redirected on to STUDENT_APP_HOST after authenticating).
export const LOGIN_HOST = 'https://azdopl-rc-adminapp.e2language.com';

// Student app host - dashboard, onboarding wizard, and course content.
export const STUDENT_APP_HOST = 'https://azdopl-rc-main.e2language.com';

export const EXAM_TYPE_CODE = 'PTE';

export const PAID_PACKAGE = {
  examTypeCode: 'PTE',
  packageCode: 'PTE_PaidV2_1',
};

export const DEFAULT_PASSWORD = 'TestPass123!';

// TC-STU-007's own test data: "confirmed-safe @mailinator.com domain".
export const ALLOWED_EMAIL_DOMAIN = 'mailinator.com';

// Confirmed on the Temporary Email Domain blocklist (TC-STU-008 test data).
export const BLOCKED_EMAIL_DOMAINS = ['mailinator.net', 'mailinator2.com'];

// Shopify staging test gateway cards (Credentials & Test Data sheet).
export const TEST_CARDS = {
  approved: { number: '1', cvv: '123' },
  declined: { number: '2', cvv: '123' },
  gatewayFailure: { number: '3', cvv: '123' },
};

export const PAYMENT_GATEWAY_HOST = 'https://e2-staging-store.myshopify.com';

/**
 * Shared, pre-existing fixture accounts from the "Credentials & Test Data"
 * / individual test cases' own Test Data fields - not created by this
 * suite, and their state is mutated by using them (a package tier, a
 * one-time promo claim, an extension). Confirmed live 2026-09-10 that all
 * three tier accounts below still authenticate; the "no-arg" package-upgrade
 * cases (047/049/052) only read state (which upgrade tiers are offered) so
 * are safe to reuse across runs, but test_ptefree28's extend-trial
 * promotion had already been claimed by a prior run when checked - treat
 * one-time-offer fixtures as already spent unless re-verified live.
 */
export const FIXTURE_ACCOUNTS = {
  powerTier: { email: 'e2e.stu.power.260908@mailinator.com', password: 'TestPass123!' },
  showtimeTier: { email: 'e2e.stu.showtime.260908@mailinator.com', password: 'TestPass123!' },
  expressExtraTier: { email: 'e2e.stu.expressextra.260908@mailinator.com', password: 'TestPass123!' },
  expiredFreeTrial: { email: 'test_ptefree28@mailinator.com', password: 'Temp@1234' },
  paidForExtension: { email: 'demo-selfgraded4@mailinator.com', password: 'Temp@1234' },
};
