import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductsPage from '../../src/pages/ProductsPage.js';

test('add multiple items and remove one', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  const products = new ProductsPage(page);
  const names = await page.locator('.inventory_item_name').allTextContents();
  const first = names[0];
  const second = names[1];

  await products.addToCartByName(first);
  await products.addToCartByName(second);
  expect(await products.getCartBadgeCount()).toBe(2);

  await products.openCart();
  // remove first
  await page.click('.cart_item:has-text("' + first + '") button');
  // verify badge 1
  expect(await products.getCartBadgeCount()).toBe(1);
});
