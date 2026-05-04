# QA AI Skills: Test Automation Guide

This document provides AI agents with the skills, patterns, and context needed to generate, validate, and extend Playwright tests for the Sauce Labs demo application.

---

## Skill 1: Write a New UI Test Using Existing Page Objects

### What This Skill Does
Generates a new E2E test that follows existing patterns and uses established page objects.

### Prerequisites
- Test target is part of an existing workflow (login → action → verify)
- Page object(s) for the feature already exist
- Test data is available (credentials, product names, etc.)

### Implementation Pattern

#### Template
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import [TargetPage] from '../../src/pages/[TargetPage].js';

test('describe what business workflow this validates', async ({ page }) => {
  // SETUP: Establish preconditions (usually login)
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  // ACTION: Execute the feature being tested
  const targetPage = new [TargetPage](page);
  await targetPage.[action]();

  // ASSERT: Verify expected outcome
  expect(await targetPage.[getter]()).toBe(expectedValue);
});
```

#### Example 1: Test Adding a Product to Cart
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductsPage from '../../src/pages/ProductsPage.js';

test('user can add backpack to cart', async ({ page }) => {
  // SETUP
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  // ACTION
  const products = new ProductsPage(page);
  await products.addToCartByName('Sauce Labs Backpack');

  // ASSERT
  expect(await products.getCartBadgeCount()).toBe(1);
});
```

**Validation Checklist**:
- ✅ Test name describes the business workflow (not "e2e test 1")
- ✅ Uses page objects (no direct `.fill()` or `.click()` in test)
- ✅ Has 3 sections: Setup → Action → Assert
- ✅ Assertion is business-focused (not just checking selector exists)
- ✅ Imports are correct (matching file structure)

#### Example 2: Test Sorting Products
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';

test('products can be sorted alphabetically ascending', async ({ page }) => {
  // SETUP
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  // ACTION
  await page.selectOption('select.product_sort_container', 'az');

  // ASSERT
  const names = await page.locator('.inventory_item_name').allTextContents();
  for (let i = 1; i < names.length; i++) {
    expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
  }
});
```

**Note**: This test doesn't have a dedicated page object yet. If this test is reused, extract sorting logic into a `InventoryPage` object.

---

### Decision Tree: When to Use Existing vs. Create New Page Object

```
Does a page object exist for this feature?
├─ YES: Use it directly in test
├─ NO: Is the feature reusable (will be tested multiple times)?
   ├─ YES: Create new page object, then use in test
   └─ NO: Inline page interaction in test (keep it simple)
```

### Quality Gates for New Tests
- **Coverage**: Test maps to a real user workflow
- **No Hard-Coded Data**: Use defaults from page object methods or parameterize
- **Stable Selectors**: Use CSS classes or data-test attributes (not dynamic IDs)
- **Clear Failure Diagnostics**: Error message indicates what failed and why
- **Minimal Test Code**: Page objects handle UI complexity, tests focus on logic

---

## Skill 2: Add an API Automation Test (Future-Proofing)

### What This Skill Does
Creates a test that validates backend behavior via API, complementing UI tests.

### Why Add API Tests?
- ✅ Faster execution (no browser overhead)
- ✅ Better error messages (HTTP status, JSON response)
- ✅ Can test edge cases UI doesn't expose
- ✅ Validates data integrity independent of UI rendering

### Implementation Pattern

#### New File: `src/helpers/ApiClient.js`
```javascript
export default class ApiClient {
  constructor(baseURL = 'https://www.saucedemo.com') {
    this.baseURL = baseURL;
  }

  async login(username, password) {
    // Note: Sauce Labs demo doesn't have a public API
    // This example shows the pattern for a typical app
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getProducts() {
    const response = await fetch(`${this.baseURL}/api/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  }

  async addToCart(productId, quantity = 1) {
    const response = await fetch(`${this.baseURL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    
    if (!response.ok) {
      throw new Error(`Add to cart failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

#### New Test File: `tests/api/auth.api.spec.js`
```javascript
import { test, expect } from '@playwright/test';
import ApiClient from '../../src/helpers/ApiClient.js';

test('login API returns valid token for correct credentials', async () => {
  const api = new ApiClient();
  
  const response = await api.login('standard_user', 'secret_sauce');
  
  expect(response).toHaveProperty('token');
  expect(response.token).toBeTruthy();
});

test('login API returns 401 for invalid credentials', async () => {
  const api = new ApiClient();
  
  try {
    await api.login('invalid_user', 'wrong_password');
    throw new Error('Expected login to fail');
  } catch (error) {
    expect(error.message).toContain('Login failed');
  }
});
```

### Quality Gates for API Tests
- ✅ Independent of UI (tests API directly)
- ✅ Clear request/response validation
- ✅ Error cases covered (invalid auth, network failures)
- ✅ Can run in CI without browser overhead

---

## Skill 3: Create Reusable Test Utilities

### What This Skill Does
Builds helper functions and data builders that reduce duplication across tests.

### Pattern 1: Test Data Builder
```javascript
// src/helpers/TestDataBuilder.js
export default class TestDataBuilder {
  static createValidCheckoutData(overrides = {}) {
    return {
      firstName: 'John',
      lastName: 'Doe',
      zipCode: '12345',
      ...overrides
    };
  }

  static createCheckoutDataVariants() {
    return [
      this.createValidCheckoutData(),
      this.createValidCheckoutData({ firstName: 'Jane' }),
      this.createValidCheckoutData({ firstName: 'Jim', zipCode: '54321' })
    ];
  }

  static getInvalidCheckoutData() {
    return [
      { firstName: '', lastName: 'Doe', zipCode: '12345' },
      { firstName: 'John', lastName: '', zipCode: '12345' },
      { firstName: 'John', lastName: 'Doe', zipCode: '' }
    ];
  }
}
```

**Usage in Test**:
```javascript
import TestDataBuilder from '../../src/helpers/TestDataBuilder.js';

test('checkout succeeds with valid data', async ({ page }) => {
  const data = TestDataBuilder.createValidCheckoutData();
  const checkout = new CheckoutPage(page);
  await checkout.fillInfo(data.firstName, data.lastName, data.zipCode);
  expect(await checkout.isFinished()).toBeTruthy();
});

test.each(TestDataBuilder.getInvalidCheckoutData())(
  'checkout fails with missing $field',
  async ({ page }, data) => {
    const checkout = new CheckoutPage(page);
    await checkout.fillInfo(data.firstName, data.lastName, data.zipCode);
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  }
);
```

### Pattern 2: Page Navigation Helper
```javascript
// src/helpers/NavigationHelper.js
export default class NavigationHelper {
  constructor(page) {
    this.page = page;
  }

  async loginAs(username = 'standard_user', password = 'secret_sauce') {
    const login = new LoginPage(this.page);
    await login.goto('/');
    await login.login(username, password);
    // Verify we're on inventory page
    await expect(this.page).toHaveURL(/inventory/);
  }

  async navigateToCheckout() {
    const products = new ProductsPage(this.page);
    await products.openCart();
    const checkout = new CheckoutPage(this.page);
    await checkout.startCheckout();
  }

  async completeCheckout(firstName, lastName, zipCode) {
    const checkout = new CheckoutPage(this.page);
    await checkout.fillInfo(firstName, lastName, zipCode);
    await checkout.finish();
    await expect(this.page.locator('.complete-header')).toBeVisible();
  }
}
```

**Usage**:
```javascript
import NavigationHelper from '../../src/helpers/NavigationHelper.js';

test('complete purchase end-to-end', async ({ page }) => {
  const nav = new NavigationHelper(page);
  
  await nav.loginAs();
  // ... add product to cart ...
  await nav.navigateToCheckout();
  await nav.completeCheckout('Jane', 'Doe', '54321');
  
  expect(page).toHaveURL(/checkout-complete/);
});
```

### Pattern 3: Assertion Helper
```javascript
// src/helpers/AssertionHelper.js
export default class AssertionHelper {
  static async assertUserIsLoggedIn(page) {
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.shopping_cart_link')).toBeVisible();
  }

  static async assertProductInCart(page, productName) {
    const basket = new BasketPage(page);
    const items = await basket.getProductNames();
    expect(items).toContain(productName);
  }

  static async assertCheckoutComplete(page) {
    const checkout = new CheckoutPage(page);
    expect(await checkout.isFinished()).toBeTruthy();
  }

  static async assertLoginError(page) {
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  }
}
```

**Usage**:
```javascript
import AssertionHelper from '../../src/helpers/AssertionHelper.js';

test('login then verify session', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();
  
  await AssertionHelper.assertUserIsLoggedIn(page);
});
```

### Quality Gates for Utilities
- ✅ Reduces code duplication (reusable across 3+ tests)
- ✅ Clear, semantic naming (reads like business language)
- ✅ Single responsibility (builder builds, helper navigates, etc.)
- ✅ Documented with JSDoc comments
- ✅ No test assertions in builder/helper (keep utilities pure)

---

## Skill 4: Manage Test Data Safely

### What This Skill Does
Implements patterns for test data that are reusable, maintainable, and secure.

### Pattern 1: Environment-Aware Credentials
```javascript
// src/helpers/TestCredentials.js
export default class TestCredentials {
  static get(userType = 'standard') {
    const env = process.env.NODE_ENV || 'test';
    
    if (env === 'test') {
      return this.getLocalTestUsers()[userType];
    }
    
    // For production/staging, load from environment
    return {
      username: process.env.TEST_USERNAME || 'standard_user',
      password: process.env.TEST_PASSWORD || 'secret_sauce'
    };
  }

  static getLocalTestUsers() {
    return {
      standard: {
        username: 'standard_user',
        password: 'secret_sauce'
      },
      lockedOut: {
        username: 'locked_out_user',
        password: 'secret_sauce'
      },
      problemUser: {
        username: 'problem_user',
        password: 'secret_sauce'
      }
    };
  }

  static getInvalidCredentials() {
    return {
      username: 'nonexistent_user',
      password: 'wrong_password'
    };
  }
}
```

**Usage**:
```javascript
// ✅ Safe: Credentials managed centrally
const creds = TestCredentials.get('standard');
await login.login(creds.username, creds.password);

// ✅ Supports environment override
// Set environment: TEST_USERNAME=staging_user npm test
```

### Pattern 2: Test Data Fixtures
```javascript
// tests/fixtures/product.fixtures.js
export const productNames = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)'
];

export const checkoutData = {
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    zipCode: '12345'
  },
  alternate: {
    firstName: 'Jane',
    lastName: 'Smith',
    zipCode: '54321'
  }
};

export const sortOptions = {
  AZ: 'az',
  ZA: 'za',
  LOW_TO_HIGH: 'lohi',
  HIGH_TO_LOW: 'hilo'
};
```

**Usage**:
```javascript
import { productNames, checkoutData } from '../../tests/fixtures/product.fixtures.js';

test('user can add any product to cart', async ({ page }) => {
  // Test with first product
  await products.addToCartByName(productNames[0]);
  expect(await products.getCartBadgeCount()).toBe(1);
});

test.each(Object.values(checkoutData))(
  'checkout works with different users',
  async ({ page }, data) => {
    // Parameterized test
  }
);
```

### Pattern 3: Test Data Cleanup
```javascript
// src/helpers/TestDataCleanup.js
export default class TestDataCleanup {
  static async clearCart(page) {
    const products = new ProductsPage(page);
    const count = await products.getCartBadgeCount();
    if (count > 0) {
      await products.openCart();
      // Remove all items
      await page.click('button:has-text("Remove")');
    }
  }

  static async logout(page) {
    await page.click('#react-burger-menu-btn');
    await page.click('#logout_sidebar_link');
  }
}
```

**Usage in Tests**:
```javascript
test.afterEach(async ({ page }) => {
  // Clean up after each test
  await TestDataCleanup.clearCart(page);
  await TestDataCleanup.logout(page);
});
```

### Security Best Practices
1. ✅ **Never hard-code production credentials** in tests
2. ✅ **Use environment variables** for sensitive data
3. ✅ **Keep test data separate** from source code (fixtures, external files)
4. ✅ **Rotate credentials** regularly if running against real systems
5. ✅ **Mask sensitive data** in logs/reports

---

## Skill 5: Diagnose and Fix Flaky Tests

### What This Skill Does
Identifies root causes of intermittent test failures and applies targeted fixes.

### Symptom: Element Not Found (Timeout)

#### Root Cause
Selector is stale, element moved, or timing issue.

#### Diagnosis
```javascript
// Run with logging
test('debug element not found', async ({ page }) => {
  await login.goto('/');
  await login.login();

  console.log('Page URL:', page.url());
  console.log('Element count:', await page.locator('.inventory_item').count());
  
  // Screenshot for inspection
  await page.screenshot({ path: 'debug.png' });
});
```

#### Solution
```javascript
// ❌ BEFORE: Brittle selector
const item = page.locator('.inventory_item'); // May be DOM order dependent

// ✅ AFTER: Robust selector with `:has-text()`
const item = page.locator('.inventory_item:has-text("Backpack")');

// ✅ BEST: Use data-test attribute if available
const item = page.locator('[data-test="product-item-0"]');
```

### Symptom: Assertion Fails Intermittently

#### Root Cause
Race condition: assertion runs before element updates.

#### Before (Flaky):
```javascript
// ❌ FLAKY: Cart may not update immediately
await products.addToCartByName('Backpack');
expect(await products.getCartBadgeCount()).toBe(1); // May fail if badge updates slowly
```

#### After (Stable):
```javascript
// ✅ STABLE: Playwright retries automatically (up to 5s)
await products.addToCartByName('Backpack');
await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
// Retries until condition is true or timeout
```

### Symptom: Tests Pass Locally, Fail in CI

#### Root Cause
Different environment, missing setup, or timing assumptions.

#### Diagnosis Checklist
- [ ] `baseURL` is correct for CI environment
- [ ] Credentials are available (environment variables)
- [ ] Network is stable (CI may be slower)
- [ ] Test has explicit waits (not relying on hard-coded sleeps)
- [ ] Screenshot/logs from CI show what failed

#### Fix
```javascript
// ❌ WRONG: Assumes fast localhost
test('add to cart', async ({ page }) => {
  await page.click('.add-btn');
  await page.waitForTimeout(100); // Too short for CI!
});

// ✅ RIGHT: Explicit wait for condition
test('add to cart', async ({ page }) => {
  await page.click('.add-btn');
  await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  // Works locally and in CI
});
```

### Symptom: Performance Issues in CI

#### Root Cause
Parallelization not working, browser initialization overhead.

#### Diagnosis
```bash
# Check if tests run in parallel
npx playwright test --reporter=verbose | grep "Worker"

# If all tests show "Worker 1", parallelization is disabled
```

#### Fix
```bash
# Enable parallelization
npx playwright test --workers=4

# Or in playwright.config.js:
export default defineConfig({
  workers: process.env.CI ? 4 : 1
});
```

### Flakiness Diagnostic Flowchart
```
Test fails intermittently
├─ Element not found?
│  ├─ YES → Update selector (use :has-text or data-test)
│  └─ NO → Next
├─ Assertion times out?
│  ├─ YES → Use expect(...).toBeVisible() with auto-retry
│  └─ NO → Next
├─ Works locally, fails in CI?
│  ├─ YES → Check environment, remove hard sleeps
│  └─ NO → Next
└─ Performance slow in CI?
   └─ Check parallelization, increase workers
```

### Quality Gates for Flaky Test Fixes
- ✅ No hard-coded `page.waitForTimeout()` (use explicit waits)
- ✅ Selectors are semantic (not relying on order)
- ✅ Tests pass consistently (run 10x locally + in CI)
- ✅ Timeout values are reasonable (not 1000ms for 1 byte response)
- ✅ Clear error messages when test fails

---

## Skill 6: Validate Test Coverage Mapping

### What This Skill Does
Ensures tests map to real business workflows and catch important defects.

### Coverage Mapping Template
```javascript
// Create this matrix in a comment at top of test file or as documentation

/*
COVERAGE MAP: Login Flows
├─ Happy Path: valid_user + correct_password → [login-success.spec.js]
├─ Unhappy Paths:
│  ├─ locked_out_user + correct_password → [login-invalid.spec.js]
│  ├─ valid_user + wrong_password → [login-invalid.spec.js]
│  └─ valid_user + empty_password → [login-validation.spec.js] [TODO]
├─ Security:
│  ├─ Password field is masked → [login-security.spec.js] [TODO]
│  └─ Session expires after 30min → [login-session.spec.js] [TODO]
└─ Performance:
   └─ Login completes within 5s → [login-performance.spec.js] [TODO]
*/
```

### Current Test Coverage Analysis
```javascript
/*
MAPPED COVERAGE: saucedemo-playwright-copilot

✅ COVERAGE (Existing Tests):
├─ Auth Workflows
│  ├─ Login → success (login-add-basket.spec.js)
│  ├─ Login → failure (invalid-login.spec.js)
│  └─ Logout (logout.spec.js)
├─ Shopping Workflows
│  ├─ Add 1 product (login-add-basket.spec.js)
│  ├─ Add multiple + remove (add-multiple-remove.spec.js)
│  ├─ View product details (product-details.spec.js)
│  └─ Sorting (sorting.spec.js)
└─ Checkout
   └─ Complete checkout (checkout.spec.js)

⚠️ GAPS (Should Add):
├─ Negative Scenarios
│  ├─ Checkout with invalid ZIP code
│  ├─ Checkout with missing first name
│  └─ Login timeout/session expiry
├─ Edge Cases
│  ├─ Add all 6 products to cart
│  ├─ Remove all products from cart
│  └─ Cart persists after page refresh
├─ Performance
│  ├─ Page load time < 3s
│  └─ Checkout completes < 5s
└─ Security
   ├─ Password field is masked
   └─ Can't access cart without login
*/
```

### How to Add Gap Tests

#### Example: Test Missing Required Fields
```javascript
// tests/e2e/checkout-validation.spec.js
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import CheckoutPage from '../../src/pages/CheckoutPage.js';

test.describe('Checkout Validation', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.login();
    // Add product and navigate to checkout
    // ... [omitted for brevity] ...
  });

  test('rejects checkout without first name', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.fillInfo('', 'Doe', '12345');
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });

  test('rejects checkout without zip code', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.fillInfo('John', 'Doe', '');
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });
});
```

#### Example: Test Cart Persistence
```javascript
// tests/e2e/cart-persistence.spec.js
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductsPage from '../../src/pages/ProductsPage.js';

test('cart items persist after page refresh', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  const products = new ProductsPage(page);
  await products.addToCartByName('Sauce Labs Backpack');
  const countBefore = await products.getCartBadgeCount();

  // Refresh page
  await page.reload();

  const countAfter = await products.getCartBadgeCount();
  expect(countAfter).toBe(countBefore);
});
```

### Coverage Quality Checklist
- ✅ Happy path covered (main workflow works)
- ✅ Unhappy paths covered (errors handled gracefully)
- ✅ Edge cases identified (empty lists, max values)
- ✅ Security basics covered (no data leaks)
- ✅ Performance baseline established (not too slow)
- ✅ All test names map to real user tasks

---

## Skill 7: Extend Page Objects for New Features

### What This Skill Does
Adds new functionality to existing page objects without breaking current tests.

### Example: Add Filtering to ProductsPage

#### Current State
```javascript
// src/pages/ProductsPage.js
export default class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.productItems = '.inventory_item';
    this.cartBadge = '.shopping_cart_badge';
    this.cartLink = '.shopping_cart_link';
  }

  async addToCartByName(name) { ... }
  async getCartBadgeCount() { ... }
  async openCart() { ... }
}
```

#### New Feature: Add Filter Support
```javascript
// src/pages/ProductsPage.js (EXTENDED)
export default class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.productItems = '.inventory_item';
    this.cartBadge = '.shopping_cart_badge';
    this.cartLink = '.shopping_cart_link';
    
    // NEW: Filter selectors
    this.sortDropdown = 'select.product_sort_container';
  }

  // EXISTING METHODS: Unchanged
  async addToCartByName(name) { ... }
  async getCartBadgeCount() { ... }
  async openCart() { ... }

  // NEW METHODS: Filter functionality
  async sortBy(option) {
    // option: 'az', 'za', 'lohi', 'hilo'
    await this.page.selectOption(this.sortDropdown, option);
  }

  async getProductNames() {
    return this.page.locator('.inventory_item_name').allTextContents();
  }

  async getPrices() {
    const prices = await this.page.locator('.inventory_item_price').allTextContents();
    return prices.map(p => parseFloat(p.replace('$', '')));
  }
}
```

#### Backward Compatibility Check
```javascript
// OLD TEST: Still works without modification
test('add to cart', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.addToCartByName('Backpack');
  expect(await products.getCartBadgeCount()).toBe(1);
});

// NEW TEST: Uses new methods
test('products sorted by price', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.sortBy('lohi');
  const prices = await products.getPrices();
  for (let i = 1; i < prices.length; i++) {
    expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
  }
});
```

### Extension Checklist
- ✅ All existing methods unchanged (backward compatible)
- ✅ New methods have clear, semantic names
- ✅ New selectors added as class properties (centralized)
- ✅ No test logic in page object (only UI interactions)
- ✅ New methods follow existing style/conventions

---

## AI Agent Validation Checklist

When an AI agent generates test code, verify against this checklist:

### Test Code Quality
- [ ] Test name describes business workflow (not "test 1")
- [ ] Imports are correct and minimal
- [ ] Uses page objects (no raw `.fill()` or `.click()` in test)
- [ ] Has 3 sections: Setup → Action → Assert
- [ ] Assertions are business-focused (not checking internal state)
- [ ] No hard-coded sensitive data (credentials, API keys)

### Page Object Quality
- [ ] Extends `BasePage` or another page object
- [ ] Selectors are class properties (not hard-coded in methods)
- [ ] All selectors use robust strategy (data-test → CSS → ID)
- [ ] Methods have clear, semantic names
- [ ] No test assertions in page object methods
- [ ] Methods are documented (JSDoc optional but helpful)

### Test Data Quality
- [ ] Uses fixtures or test data builders (not inline magic values)
- [ ] Credentials handled safely (environment variables or defaults)
- [ ] Test data is realistic (real product names, valid formats)
- [ ] No duplicated data across tests

### Execution Quality
- [ ] Test runs independently (no dependency on other tests)
- [ ] Test cleans up after itself (logout, clear cart, etc.)
- [ ] Uses explicit waits (no `page.waitForTimeout()`)
- [ ] Timeout values are reasonable (5-30s, not 100ms)
- [ ] Works in parallel execution

### Maintainability
- [ ] Selector strategy won't break on minor DOM changes
- [ ] Can be debugged easily (clear error messages)
- [ ] Can be extended (new test data, new page objects)
- [ ] Can be parameterized (for multiple data scenarios)

---

## Common Anti-Patterns to Avoid

### Anti-Pattern 1: Implicit Waits
```javascript
// ❌ DON'T: Hard-coded sleep (unreliable)
await page.waitForTimeout(2000);
expect(badge).toBe(1);

// ✅ DO: Explicit wait for condition
await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
```

### Anti-Pattern 2: Test Data Magic Numbers
```javascript
// ❌ DON'T: Magic value, not reusable
test('add 5 products', async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await products.addToCart();
  }
});

// ✅ DO: Use named constant
const PRODUCT_COUNT_TO_TEST = 5;
test('add multiple products', async ({ page }) => {
  for (let i = 0; i < PRODUCT_COUNT_TO_TEST; i++) {
    await products.addToCart();
  }
});
```

### Anti-Pattern 3: Page Object Assertions
```javascript
// ❌ DON'T: Assertions in page object
export default class ProductsPage {
  async verifyCartCount(expectedCount) {
    const count = await this.getCartBadgeCount();
    expect(count).toBe(expectedCount); // Test logic in POM!
  }
}

// ✅ DO: Assertions in tests
test('cart count is correct', async ({ page }) => {
  const products = new ProductsPage(page);
  const count = await products.getCartBadgeCount();
  expect(count).toBe(1); // Assertion in test
});
```

### Anti-Pattern 4: Cross-Test Dependencies
```javascript
// ❌ DON'T: Test depends on previous test's state
test('step 1: login', async ({ page }) => { ... });
test('step 2: add product', async ({ page }) => {
  // Assumes step 1 ran first!
});

// ✅ DO: Each test is independent
test('user can login and add product', async ({ page }) => {
  // Complete workflow in one test
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();
  // ... add product ...
});
```

---

## Summary: QA Skills & Patterns

| Skill | When to Use | Quality Gate |
|-------|------------|--------------|
| **Write UI Test** | Adding new test case | Maps to real workflow, uses POMs |
| **Add API Test** | Testing backend separately | Independent of UI, clear assertions |
| **Create Utility** | Reduces duplication (3+ uses) | Semantic naming, single responsibility |
| **Manage Test Data** | Reusable across tests | Safe, maintainable, environment-aware |
| **Diagnose Flakiness** | Test fails intermittently | Explicit waits, stable selectors |
| **Map Coverage** | Ensuring adequate testing | Happy + unhappy paths covered |
| **Extend Page Objects** | Adding features to existing POMs | Backward compatible, no breaking changes |

---

## Resources

- **Page Objects**: See `/src/pages/*.js`
- **Example Tests**: See `/tests/e2e/*.spec.js`
- **Config**: See `playwright.config.js`
- **Playwright Docs**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices

---

**Generated for AI Test Automation Agents**
This document provides the knowledge base for autonomous test generation, validation, and maintenance.
