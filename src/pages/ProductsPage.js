import BasePage from './BasePage.js';

export default class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.productItems = '.inventory_item';
    this.cartBadge = '.shopping_cart_badge';
    this.cartLink = '.shopping_cart_link';
  }

  async addToCartByName(name) {
    const item = this.page.locator(`${this.productItems}:has-text("${name}")`);
    await item.locator('button').click();
  }

  async getCartBadgeCount() {
    const hasBadge = await this.page.locator(this.cartBadge).count();
    if (!hasBadge) return 0;
    const text = await this.page.innerText(this.cartBadge);
    return Number(text.trim());
  }

  async openCart() {
    await this.page.click(this.cartLink);
  }
}
