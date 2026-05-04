import BasePage from './BasePage.js';

export default class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstName = '#first-name';
    this.lastName = '#last-name';
    this.postal = '#postal-code';
    this.continueBtn = '#continue';
    this.finishBtn = '#finish';
    this.completeHeader = '.complete-header';
  }

  async startCheckout() {
    await this.page.click('.checkout_button, #checkout');
  }

  async fillInfo(first = 'John', last = 'Doe', postal = '12345') {
    await this.page.fill(this.firstName, first);
    await this.page.fill(this.lastName, last);
    await this.page.fill(this.postal, postal);
    await this.page.click(this.continueBtn);
  }

  async finish() {
    await this.page.click(this.finishBtn);
  }

  async isFinished() {
    return this.page.isVisible(this.completeHeader);
  }
}
