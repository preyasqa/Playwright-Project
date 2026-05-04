import BasePage from './BasePage.js';

export default class ProductDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = '.inventory_details_name';
    this.description = '.inventory_details_desc';
    this.price = '.inventory_details_price';
    this.addButton = 'button.btn_primary, button.btn_inventory';
    this.backButton = '.inventory_details_back_button';
  }

  async openByName(name) {
    await this.page.locator(`.inventory_item_name:has-text("${name}")`).click();
  }

  async getDetails() {
    return {
      title: await this.page.innerText(this.title),
      description: await this.page.innerText(this.description),
      price: await this.page.innerText(this.price)
    };
  }

  async addToCart() {
    await this.page.click(this.addButton);
  }
}
