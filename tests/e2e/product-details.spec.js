import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductDetailsPage from '../../src/pages/ProductDetailsPage.js';

test('product details show correct info', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  const names = await page.locator('.inventory_item_name').allTextContents();
  const first = names[0];

  const details = new ProductDetailsPage(page);
  await details.openByName(first);
  const d = await details.getDetails();
  expect(d.title).toBe(first);
  expect(d.description.length).toBeGreaterThan(0);
  expect(d.price).toMatch(/\$\d+/);
});
