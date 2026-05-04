import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';

test('logout returns to login page', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  await page.click('#react-burger-menu-btn');
  await page.click('#logout_sidebar_link');

  await expect(page.locator('#login-button')).toBeVisible();
});
