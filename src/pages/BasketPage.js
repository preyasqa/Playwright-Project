import BasePage from './BasePage.js';

export default class BasketPage extends BasePage {
  constructor(page) {
    super(page);
    this.cartItemNames = '.cart_item .inventory_item_name';
  }

  async getProductNames() {
    return this.page.locator(this.cartItemNames).allTextContents();
  }
}
