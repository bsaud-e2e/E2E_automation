# E2Language Student E2E Automation

TypeScript + Playwright end-to-end automation for E2Language's Student flows, built against the **Page Object Model** and driven by the test cases in `E2Language_E2E_Test_Case_Suite_v12.xlsx`.

## Setup

```bash
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` if you need to override any host:

```bash
cp .env.example .env
```

## Running the suite

```bash
npm test                     # full suite, headless
npm run test:headed          # full suite, headed (watch it run)
npm run test:registration    # registration specs only
npm run test:login           # login/logout/session-scope specs only
npm run test:account-security # password reset specs only
npm run test:debug           # Playwright inspector
npm run report                # open the last HTML report
npm run typecheck             # tsc --noEmit
```

A full run takes roughly 5–6 minutes against the live staging environment — most of that is waiting on real Azure B2C redirects and the free-trial onboarding wizard, not test logic.

## Continuous Integration

`.github/workflows/e2e-tests.yml` runs the full suite on every push to any branch (and can be triggered manually from the Actions tab). It type-checks, installs Chromium, runs `npm test`, and uploads the HTML report (plus traces/videos on failure) as workflow artifacts.

Since every run performs real registrations and real Shopify test-card payments against the live staging environment, pushing frequently means creating staging test accounts frequently — narrow the `on.push.branches` filter in the workflow if that becomes noisy (e.g. to `main` only).

### QA Agent (automated failure triage)

After the suite runs, `scripts/qa-report.js` reads `results.json` (Playwright's JSON reporter output), and if there are any failures, sends them to DeepSeek's API for classification (Automation/locator, Timing/wait, Test-data, Environment, or Application defect — with a known `SecurityError`/microfrontend false-positive pattern hard-coded to never be reported as a real defect). It posts the resulting report as a comment on the pushed branch's open PR, or prints it to the workflow log if there isn't one. Requires a `DEEPSEEK_API_KEY` repo secret (Settings → Secrets and variables → Actions) — without it, this step fails but the test run and artifact upload are unaffected.

There's a second, separate QA tool in `.claude/agents/qa-agent.md` — a Claude Code subagent with the same classification rules, for interactive use (`Agent(subagent_type: "qa-agent")` from a Claude Code session) rather than unattended CI runs.

## Project structure

```
pages/                    Page Object Model
  BasePage.ts              shared goto() + humanType()/humanClick() helpers
  RegistrationPage.ts       shared multi-step registration form (free + paid entry points)
  LoginPage.ts               shared Azure B2C login page
  DashboardPage.ts            Student/Home - profile menu, logout
  OnboardingWizardPage.ts      generic completion of the post-registration wizard
  ForgotPasswordPage.ts         B2C forgot-password flow
  PaymentPage.ts                  Payment Information page + Shopify checkout
  ScoreCalculatorPage.ts           System Requirement Checker -> ~24 questions -> score report

test-data/
  registrationData.ts       hosts, packages, test emails/domains, test cards — sourced from the Excel sheet

utils/
  dataGenerator.ts          unique test-email generator
  testUser.ts                 registerFreeStudent() / createOnboardedStudent() fixtures

tests/
  fixtures.ts                custom test/expect wrapper (see "Bot detection" below)
  registration/               free & paid registration, negative paths, payment method visibility
  login/                        login, logout, session scope
  account-security/              password reset
  score-calculator/               System Requirement Checker through to the score report
```

## Test coverage

| Test Case | Title | Spec file |
|---|---|---|
| TC-STU-001 | Student logs in with valid credentials | `tests/login/login.spec.ts` |
| TC-STU-002 | Student login fails with wrong credentials | `tests/login/login.spec.ts` |
| TC-STU-003 | Student logs out successfully | `tests/login/logout.spec.ts` |
| TC-STU-004 | Student session is not lost when switching apps | `tests/login/session-scope.spec.ts` |
| TC-STU-007 | Student registers and pays successfully | `tests/registration/paid-registration.spec.ts` |
| TC-STU-008 | Registration is blocked for disposable email domains | `tests/registration/registration-negative.spec.ts` |
| TC-STU-011 | Card and PayPal payment options both appear | `tests/registration/payment-method-visibility.spec.ts` |
| TC-STU-055 | Student requests a password reset email | `tests/account-security/password-reset.spec.ts` |
| TC-STU-057 | Password reset doesn't reveal whether an email exists | `tests/account-security/password-reset.spec.ts` |
| TC-STU-072 | Student completes the Score Calculator (V2) and receives a score report | `tests/score-calculator/score-calculator.spec.ts` |

Plus supporting specs not tied to a single TC ID: free-trial registration happy path and field validation (`tests/registration/free-registration.spec.ts`), and a duplicate-email registration check (`tests/registration/registration-negative.spec.ts`).

## Environment

All specs run against the confirmed staging host `https://azdopl-rc-registrationapp.e2language.com` (and its sibling `azdopl-rc-*.e2language.com` hosts for login/dashboard/payment). **Do not** point this suite at `signup.e2language.com`, `app.e2language.com`, or `www.e2language.com` — the Excel sheet documents those as production hostnames, and `signup.e2language.com` was confirmed to hand off into them before the sheet's 2026-09-09 URL correction.

### Bot detection

The registration host runs behavioral bot detection that silently drops form submissions made via Playwright's plain `.fill()`/`.click()` — no error, no network call, nothing. Real mouse movement and per-keystroke typing get through fine. Every page interaction goes through `BasePage.humanType()` / `BasePage.humanClick()` for this reason; don't bypass them with raw Locator calls in new specs.

## Known findings (not automation bugs)

These are live-site behaviors this suite caught, distinct from failures in the test code itself:

- **TC-STU-011 fails on every run**: the paid-registration checkout (`e2-staging-store.myshopify.com`) currently only offers **Credit Card** — no PayPal option is rendered anywhere on the page. This contradicts the Excel sheet's documented "Passed" result (Card + PayPal + Express checkout row). Possibly PayPal was disabled since that run, or the original pass used a different entry point (e.g. Upgrade/Switch Course rather than fresh paid registration).
- **Registration auto-login ≠ a full SSO session**: right after registering, the browser can reach `Student/Home` but does **not** hold a full Azure B2C SSO session — navigating straight to the Teacher host forces a fresh login prompt instead of a silent SSO redirect. The login/session-scope specs explicitly re-authenticate through the real login form to get a comparable session to what a real user browsing normally would have.
- Blocked email domains (`mailinator.net`, `mailinator2.com`) are rejected via a modal (`#errorDialogPane`) shown only on final form submit, not inline validation on the email field — the email input's own CSS class stays `valid` throughout.
- **TC-STU-072's documented microphone blocker doesn't apply here**: the sheet's manual run couldn't complete the Score Calculator's Speaking/Read-Aloud questions because that environment had no microphone. Launching Chromium with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` plus granting the `microphone`/`camera` permission (see `playwright.config.ts`) makes the RECORD/STOP widget's `MediaRecorder` produce real (silent) audio, which the app accepts — so this suite completes the full flow, including Speaking, end to end.

## Extending this suite

- New page interactions: extend a `pages/*.ts` class, don't put selectors directly in spec files.
- New test data: add to `test-data/registrationData.ts` rather than inlining literals in specs.
- Need a logged-in, fully-onboarded student fixture: use `createOnboardedStudent(page)` from `utils/testUser.ts`. Need just a registered (not onboarded) account: use `registerFreeStudent(page)` — faster, since it skips the wizard.
# E2E_automation
