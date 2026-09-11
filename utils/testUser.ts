import { Page } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';
import { OnboardingWizardPage } from '../pages/OnboardingWizardPage';
import { uniqueEmail } from './dataGenerator';
import { ALLOWED_EMAIL_DOMAIN, DEFAULT_PASSWORD, EXAM_TYPE_CODE } from '../test-data/registrationData';

export interface TestStudent {
  email: string;
  password: string;
}

/** Registers a fresh free-trial student. The account exists once this resolves, but the browser is left mid onboarding-wizard, not on the dashboard. */
export async function registerFreeStudent(page: Page, emailPrefix = 'e2e.stu'): Promise<TestStudent> {
  const registrationPage = new RegistrationPage(page);
  const email = uniqueEmail(emailPrefix, ALLOWED_EMAIL_DOMAIN);
  const password = DEFAULT_PASSWORD;

  await registrationPage.gotoFreeRegistration(EXAM_TYPE_CODE);
  await registrationPage.enterEmail(email);
  await registrationPage.proceedToPersonalDetails();
  await registrationPage.fillPersonalDetails('Auto', 'QA', password);
  await registrationPage.submit();
  await page.waitForURL('**/Registration/PostFreeRegistration**', { timeout: 30_000 });

  return { email, password };
}

/** Registers a fresh free-trial student and completes onboarding, landing on Student/Home - the known-credentials fixture used by the login/logout/session-scope specs. */
export async function createOnboardedStudent(page: Page, emailPrefix = 'e2e.stu'): Promise<TestStudent> {
  const student = await registerFreeStudent(page, emailPrefix);
  await new OnboardingWizardPage(page).complete();
  return student;
}
