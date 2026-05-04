import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';

function isSortedAsc(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1].localeCompare(arr[i]) > 0) return false;
  }
  return true;
}

function isSortedDesc(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1].localeCompare(arr[i]) < 0) return false;
  }
  return true;
}

test('products sort A to Z and Z to A', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  const sortSelect = page.locator('select.product_sort_container');
  await sortSelect.selectOption('az');
  const namesAz = await page.locator('.inventory_item_name').allTextContents();
  expect(namesAz.length).toBeGreaterThan(0);
  expect(isSortedAsc(namesAz)).toBeTruthy();

  await sortSelect.selectOption('za');
  const namesZa = await page.locator('.inventory_item_name').allTextContents();
  expect(namesZa.length).toBeGreaterThan(0);
  expect(isSortedDesc(namesZa)).toBeTruthy();
});
