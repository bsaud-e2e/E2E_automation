import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  // Different spec FILES now run concurrently (see `workers` below) - kept
  // false so tests WITHIN one file still run in file order on a single
  // worker, which tests/dashboard/extend-trial-survey.spec.ts depends on
  // (TC-STU-018 must complete before TC-STU-017 checks whether the shared
  // one-time-use fixture account's survey is still available).
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Most specs register their own fresh, uniquely-emailed account and are
  // fully independent, so running multiple spec files concurrently is safe
  // and meaningfully faster than the previous workers:1. A handful of
  // files share a pre-existing FIXTURE_ACCOUNTS login (grep for
  // "FIXTURE_ACCOUNTS\." under tests/ to find them) - reviewed live and
  // none of them currently read state another one of those files mutates,
  // so this is safe today, but re-check that if a new spec is added
  // against a shared fixture account. Confirmed live at workers:4 that a
  // few timing-sensitive specs (a floating overlay not clearing in time,
  // slower page renders under CPU contention) got flaky purely from the
  // concurrent load, with no headroom margin left - workers:2 keeps most
  // of the speedup (~5x became ~2-3x) while leaving enough slack that
  // those didn't reproduce on rerun.
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list'], ['json', { outputFile: 'results.json' }]],
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.SIGNUP_BASE_URL || 'https://azdopl-rc-registrationapp.e2language.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // See tests/fixtures.ts and pages/BasePage.ts - signup.e2language.com's
    // bot detection is sensitive to the automation-controlled launch flag on
    // top of navigator.webdriver, so both are neutralised together.
    // The fake-device flags + granted permissions below are for the Score
    // Calculator's Speaking (Read Aloud) questions - confirmed live that a
    // real MediaRecorder capture (even of a synthetic/silent fake device) is
    // required, getUserMedia alone without these flags leaves the recorder
    // widget non-functional. Harmless no-op for every other spec.
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
    permissions: ['microphone', 'camera'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
