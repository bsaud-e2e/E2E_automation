import { test as base, expect } from '@playwright/test';

/**
 * The registration host's bot detection flags sessions where
 * navigator.webdriver is true (Playwright's default) even when every
 * interaction is otherwise realistic - confirmed live by comparing identical
 * flows with and without this override. Applied to every context so all
 * registration specs get it automatically. See also pages/BasePage.ts
 * (humanType/humanClick), required for the same reason.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await use(context);
  },
});

export { expect };
