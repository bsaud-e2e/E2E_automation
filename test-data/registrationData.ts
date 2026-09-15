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

// All credentials below are sourced from process.env (see .env.example,
// which splits them into two kinds - REUSED fixture accounts below, and
// this one, GENERATED PER RUN: not a fixed account, just the password
// template every freshly-registered account in this suite uses) so they
// live in one gitignored place rather than in source. Each falls back to
// its last-known-working value so the suite still runs if .env is left
// unfilled, but .env is where they should be kept up to date going forward.
export const DEFAULT_PASSWORD = process.env.DEFAULT_STUDENT_PASSWORD || 'TestPass123!';

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
 * Reads a numbered-suffix env var group (BASE, BASE_2, BASE_3, ...) into a
 * pool of { email, password } accounts, so a test can try more than one
 * fallback account when the primary one runs out of usable state (e.g. no
 * unwatched recorded class left). Always includes the un-suffixed pair
 * first (falling back to defaultEmail/defaultPassword if that's unset),
 * then FIXTURE_X_EMAIL_2/PASSWORD_2, _3, etc. for as many as are actually
 * set in .env - stops at the first missing number, so the pool only grows
 * when you add one.
 */
function accountPool(
  envPrefix: string,
  defaultEmail: string,
  defaultPassword: string
): { email: string; password: string }[] {
  const pool = [
    {
      email: process.env[`${envPrefix}_EMAIL`] || defaultEmail,
      password: process.env[`${envPrefix}_PASSWORD`] || defaultPassword,
    },
  ];
  for (let i = 2; ; i++) {
    const email = process.env[`${envPrefix}_EMAIL_${i}`];
    const password = process.env[`${envPrefix}_PASSWORD_${i}`];
    if (!email || !password) break;
    pool.push({ email, password });
  }
  return pool;
}

/**
 * REUSED fixture accounts (see .env.example's "1. REUSED" section) -
 * shared, pre-existing accounts from the "Credentials & Test Data" sheet /
 * individual test cases' own Test Data fields, not created by this suite.
 * Their state is mutated by using them, at different paces per account -
 * see the per-key comments below for exactly which TC ID(s) use each one
 * and what "needs refreshing" looks like for it. Contrast with
 * DEFAULT_PASSWORD above: everything NOT listed here registers its own
 * fresh, uniquely-emailed account on every run instead of reusing one.
 */
export const FIXTURE_ACCOUNTS = {
  // TC-STU-047 (Power -> Silver upgrade allowed). Also logged into by
  // TC-STU-036, 065/066, 069, 075/076, 081/091/092/093, 097/104 - all
  // read-only or hitting a confirmed-broken entry point, so only
  // TC-STU-069 (marks a class "Watched") mutates real state here.
  powerTier: {
    email: process.env.FIXTURE_POWER_TIER_EMAIL || 'e2e.stu.power.260908@mailinator.com',
    password: process.env.FIXTURE_POWER_TIER_PASSWORD || 'TestPass123!',
  },
  // TC-STU-049 (Showtime -> Gold upgrade allowed). Read-only - safe indefinitely.
  showtimeTier: {
    email: process.env.FIXTURE_SHOWTIME_TIER_EMAIL || 'e2e.stu.showtime.260908@mailinator.com',
    password: process.env.FIXTURE_SHOWTIME_TIER_PASSWORD || 'TestPass123!',
  },
  // TC-STU-052 (Express Extra -> Silver upgrade allowed). Read-only - safe indefinitely.
  expressExtraTier: {
    email: process.env.FIXTURE_EXPRESS_EXTRA_TIER_EMAIL || 'e2e.stu.expressextra.260908@mailinator.com',
    password: process.env.FIXTURE_EXPRESS_EXTRA_TIER_PASSWORD || 'TestPass123!',
  },
  // TC-STU-017 / TC-STU-018 (expired-free-trial "Extend Trial" survey) -
  // one-time-per-account: once either test completes the survey, the
  // modal stops appearing for this account at all (TC-STU-017 detects
  // this and skips rather than faking a result). Needs a FREE-tier
  // expired account specifically - a paid-tier expired account (e.g.
  // tdse2-dpaid-5@mailinator.com, tried and confirmed live to be an
  // expired paid Express account) shows a different modal entirely and
  // won't work here.
  expiredFreeTrial: {
    email: process.env.FIXTURE_EXPIRED_FREE_TRIAL_EMAIL || 'student-pte-123@mailinator.com',
    password: process.env.FIXTURE_EXPIRED_FREE_TRIAL_PASSWORD || 'Temp@1234',
  },
  // TC-STU-020 (paid package extension) - self-consuming: a passing run
  // makes a real 1-week extension purchase, pushing this account's expiry
  // out by that much. It naturally becomes "expired" and testable again
  // once that time elapses; no swap needed unless you want it passing
  // sooner. Confirmed live 2026-09-14: "2 days remaining" (not expired).
  paidForExtension: {
    email: process.env.FIXTURE_PAID_FOR_EXTENSION_EMAIL || 'demo-selfgraded4@mailinator.com',
    password: process.env.FIXTURE_PAID_FOR_EXTENSION_PASSWORD || 'Temp@1234',
  },
  // TC-E2E-054 (view teacher's graded feedback). Read-only - safe
  // indefinitely. Confirmed live 2026-09-15 to have a teacher-graded
  // Write Email submission (Score 17). The Assessments grid itself hits
  // the same broken accordion-population defect as TC-E2E-053 (clicking
  // to expand never actually loads row data via automation, confirmed
  // live even after a full expand+wait), so this submission's known
  // direct URL is used instead of the grid click path - see
  // GRADED_SUBMISSION_URL below and tests/assessments/graded-feedback.spec.ts.
  gradedSubmission: {
    email: process.env.FIXTURE_GRADED_SUBMISSION_EMAIL || 'kadaj29422@prorises.com',
    password: process.env.FIXTURE_GRADED_SUBMISSION_PASSWORD || 'P@ssw0rd',
  },
};

// TC-STU-064 (paid student watches a recorded class) - the powerTier
// account above only has a small, finite list of recorded classes, and
// once every one of them is watched, the test has nothing left to click.
// This pool lets it try each account in turn until it finds one with an
// unwatched class left, rather than failing outright the moment the first
// one runs dry. Add more fallbacks any time by setting
// FIXTURE_POWER_TIER_EMAIL_2/PASSWORD_2, _3, etc. in .env - none are
// required, so this is a 1-account pool (just powerTier) until you do.
export const POWER_TIER_ACCOUNT_POOL = accountPool(
  'FIXTURE_POWER_TIER',
  'e2e.stu.power.260908@mailinator.com',
  'TestPass123!'
);

// The one confirmed-graded submission on the gradedSubmission fixture
// account (PTE Core "Write Email", activityId 1001045, Score 17) - see
// the FIXTURE_ACCOUNTS.gradedSubmission comment above for why this is
// reached directly rather than through the (broken) Assessments grid.
export const GRADED_SUBMISSION_URL = `${STUDENT_APP_HOST}/Student/PteCoreWriteEmail/View?activityId=1001045`;
