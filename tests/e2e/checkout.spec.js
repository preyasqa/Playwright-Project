import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductsPage from '../../src/pages/ProductsPage.js';
import CheckoutPage from '../../src/pages/CheckoutPage.js';

test('checkout flow completes successfully', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  const products = new ProductsPage(page);
  const firstProduct = await page.locator('.inventory_item_name').first().innerText();
  await products.addToCartByName(firstProduct);
  await products.openCart();

  const checkout = new CheckoutPage(page);
  await checkout.startCheckout();
  await checkout.fillInfo('Jane', 'Doe', '54321');
  await checkout.finish();

  expect(await checkout.isFinished()).toBeTruthy();
});
