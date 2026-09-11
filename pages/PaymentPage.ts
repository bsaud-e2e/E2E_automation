import { FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PAYMENT_GATEWAY_HOST } from '../test-data/registrationData';

/**
 * The E2Language-hosted "Payment Information" page reached after a paid
 * registration form (or Upgrade/Switch Course/Extend/Shop) submits. It only
 * offers a promo code and a single "GO TO CHECKOUT" handoff - the actual
 * payment method choice (Credit card / PayPal) and card entry live on the
 * Shopify-hosted checkout this links to, not here.
 */
export class PaymentPage extends BasePage {
  readonly promoCodeInput: Locator;
  readonly applyVoucherButton: Locator;
  readonly goToCheckoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.promoCodeInput = page.locator('#promo-code');
    this.applyVoucherButton = page.locator('#voucherBtn');
    // Different Payment Information page templates (registration vs.
    // upgrade vs. extend/add-on) use different element ids for the same
    // "GO TO CHECKOUT" action, so this matches on the stable visible text.
    this.goToCheckoutLink = page.locator('button, a').filter({ hasText: /go to checkout/i }).first();
  }

  async proceedToCheckout(): Promise<void> {
    await this.humanClick(this.goToCheckoutLink);
    await this.page.waitForURL(new RegExp(PAYMENT_GATEWAY_HOST.replace(/https:\/\//, '')), { timeout: 30_000 });
  }
}

/**
 * The Shopify-hosted checkout itself (e2-staging-store.myshopify.com). Card
 * number/expiry/CVV/name fields each render inside their own PCI-compliant
 * iframe (checkout.pci.shopifyinc.com) - the iframe elements' own ids are
 * randomly generated per session (e.g. "card-fields-number-bikcvowkvnl00000"),
 * so they're targeted by id prefix. Confirmed live end-to-end with test
 * card 1 (approved): fills the card + billing address, selects a state (the
 * postcode has to actually match it, Shopify validates it), and submits.
 */
export class ShopifyCheckoutPage extends BasePage {
  readonly creditCardOption: Locator;
  readonly paypalOption: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateSelect: Locator;
  readonly postalCodeInput: Locator;
  readonly payButton: Locator;

  constructor(page: Page) {
    super(page);
    this.creditCardOption = page.getByText(/pay with credit card/i).first();
    this.paypalOption = page.getByText('PayPal', { exact: true }).first();
    this.firstNameInput = page.locator('input[name="firstName"]').first();
    this.lastNameInput = page.locator('input[name="lastName"]').first();
    this.addressInput = page.locator('input[name="address1"]').first();
    this.cityInput = page.locator('input[name="city"]').first();
    this.stateSelect = page.locator('select[name="zone"]').first();
    this.postalCodeInput = page.locator('input[name="postalCode"]').first();
    this.payButton = page.locator('#checkout-pay-button, button:has-text("Pay now")').first();
  }

  /** Reads the checkout's total order amount, e.g. "$69.00", from the order summary. */
  async getOrderTotal(): Promise<string | null> {
    const text = await this.page.evaluate(() => document.body.innerText);
    const match = text.match(/Total\s*\n?\s*USD\s*\$?([\d,]+\.\d{2})/i) ?? text.match(/\$([\d,]+\.\d{2})/);
    return match ? match[1] : null;
  }

  private cardNumberFrame(): FrameLocator {
    return this.page.frameLocator('iframe[id^="card-fields-number-"]');
  }

  private cardExpiryFrame(): FrameLocator {
    return this.page.frameLocator('iframe[id^="card-fields-expiry-"]');
  }

  private cardCvvFrame(): FrameLocator {
    return this.page.frameLocator('iframe[id^="card-fields-verification_value-"]');
  }

  private cardNameFrame(): FrameLocator {
    return this.page.frameLocator('iframe[id^="card-fields-name-"]');
  }

  async fillCard(cardNumber: string, expiryMonth: string, expiryYear: string, cvv: string, nameOnCard: string): Promise<void> {
    await this.humanType(this.cardNumberFrame().locator('#number'), cardNumber);
    // The expiry field auto-inserts "/" after the 2nd digit - typing it as
    // one fast string races that mask and can scramble the digits (observed
    // live: "1230" landing as "13/0"). Typing month and year as two
    // separate calls, letting the mask settle between them, is reliable.
    const expiryInput = this.cardExpiryFrame().locator('#expiry');
    await expiryInput.click();
    await this.page.keyboard.type(expiryMonth, { delay: 80 });
    await this.page.waitForTimeout(200);
    await this.page.keyboard.type(expiryYear, { delay: 80 });
    await this.humanType(this.cardCvvFrame().locator('#verification_value'), cvv);
    await this.humanType(this.cardNameFrame().locator('#name'), nameOnCard);
  }

  /**
   * Billing address for Sydney, New South Wales, 2000 - a real, always-valid
   * combination. Selecting the state by option index instead of by label was
   * fragile: the option order isn't stable across sessions, and using
   * whichever state landed in that slot with a hardcoded postcode caused a
   * state/postcode mismatch Shopify's validation rejects.
   */
  async fillBillingAddress(firstName: string, lastName: string): Promise<void> {
    await this.humanType(this.firstNameInput, firstName);
    await this.humanType(this.lastNameInput, lastName);
    await this.humanType(this.addressInput, '123 Test St');
    await this.humanType(this.cityInput, 'Sydney');
    await this.stateSelect.selectOption({ label: 'New South Wales' });
    await this.humanType(this.postalCodeInput, '2000');
  }

  async submitPayment(): Promise<void> {
    await this.humanClick(this.payButton);
  }

  /** Fills card + billing details and submits - waits for the "Access Dashboard" order-confirmation page. */
  async completePayment(cardNumber: string, cvv: string, nameOnCard = 'Auto QA'): Promise<void> {
    await this.fillCard(cardNumber, '12', '30', cvv, nameOnCard);
    await this.fillBillingAddress('Auto', 'QA');
    await this.submitPayment();
    await this.page.getByText('Access Dashboard').waitFor({ state: 'visible', timeout: 60_000 });
  }
}
