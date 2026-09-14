import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
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
