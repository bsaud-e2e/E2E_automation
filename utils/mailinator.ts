import { BrowserContext } from '@playwright/test';

/**
 * Reads the public Mailinator inbox for a @mailinator.com address (no login
 * required for public inboxes) and extracts a 6-digit verification code
 * from the newest "Verification Code" email. Confirmed live against the
 * Azure B2C password-reset flow's own OTP email. Polls because delivery
 * isn't instant - typically lands within ~10-20s in this environment.
 */
export async function fetchVerificationCode(
  context: BrowserContext,
  inboxName: string,
  maxAttempts = 30
): Promise<string | null> {
  const mailPage = await context.newPage();
  let code: string | null = null;
  try {
    for (let i = 0; i < maxAttempts && !code; i++) {
      await mailPage.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${inboxName}`, {
        waitUntil: 'domcontentloaded',
      });
      await mailPage.waitForTimeout(5_000);
      const row = mailPage.locator('tr', { hasText: 'Verification Code' }).first();
      if ((await row.count()) > 0) {
        await row.click();
        await mailPage.waitForTimeout(3_000);
        const bodyText = await mailPage.evaluate(() => document.body.innerText);
        const match = bodyText.match(/\b(\d{6})\b/);
        if (match) code = match[1];
      }
    }
  } finally {
    await mailPage.close();
  }
  return code;
}
