import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductsPage from '../../src/pages/ProductsPage.js';
import BasketPage from '../../src/pages/BasketPage.js';

test('login, add product to cart and verify', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  const products = new ProductsPage(page);
  const firstProduct = await page.locator('.inventory_item_name').first().innerText();
  await products.addToCartByName(firstProduct);

  expect(await products.getCartBadgeCount()).toBe(1);

  await products.openCart();
  const basket = new BasketPage(page);
  const items = await basket.getProductNames();
  expect(items).toContain(firstProduct);
});
