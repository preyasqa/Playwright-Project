# Developer Guide: Running, Debugging & Extending Tests

This guide is designed for QA engineers and developers who need to run, debug, and write Playwright tests.

---

## Part 1: Quick Start

### Prerequisites
- **Node.js** 16+ installed
- **npm** 7+ installed
- **Git** for version control
- **VS Code** (recommended IDE)

### Setup (5 minutes)

```bash
# 1. Clone the repository
git clone <repo-url>
cd saucedemo-playwright-copilot

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (one-time setup)
npx playwright install

# 4. Verify setup by running tests
npm test
```

**Expected Output**:
```
✓ login, add product to cart and verify
✓ checkout flow completes successfully
✓ login failure shows error message
✓ product details show correct info
✓ products sort A to Z and Z to A
✓ add multiple items and remove one
✓ logout returns to login page

7 passed (10s)
```

---

## Part 2: Running Tests

### Run All Tests (Headless)
```bash
npm test
```
- Runs in **headless mode** (no browser window)
- Uses **parallel workers** for speed
- Generates **HTML report** automatically

### Run All Tests (Headed Mode)
```bash
npm run test:headed
```
- Opens **browser window**
- Useful for **visual inspection**
- Slower than headless (sequential execution)

### Run Specific Test File
```bash
# Single test file
npx playwright test tests/e2e/login-add-basket.spec.js

# Multiple specific tests
npx playwright test tests/e2e/login*.spec.js
```

### Run Tests by Pattern
```bash
# Match test name
npx playwright test -g "add multiple"

# Match file pattern
npx playwright test tests/e2e/checkout
```

### Run with Specific Browser
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit

# All configured browsers
npx playwright test --project=chromium --project=firefox
```

### Control Parallelization
```bash
# Sequential (one test at a time)
npx playwright test --workers=1

# 4 parallel workers
npx playwright test --workers=4

# Auto-detect (default)
npx playwright test
```

### View Reports

#### Playwright HTML Report
```bash
# Generate and open
npm run test:report
```
Opens `playwright-report/index.html` in your browser.

**Includes**:
- ✅ Test results (pass/fail/skip)
- 📸 Screenshots on failure
- 🎬 Video recordings (if enabled)
- 📊 Execution timeline

#### Allure Report
```bash
# Run tests + generate Allure data
npm run test:allure

# Generate Allure HTML report
npm run allure:generate

# Open Allure report
npm run allure:open
```

**Allure Dashboard Features**:
- Historical trends
- Test duration breakdown
- Categories (by status, suite, etc.)
- Failure root cause analysis

---

## Part 3: Debugging Failing Tests

### Strategy 1: Inspect Test Output
```bash
# Show detailed test output
npx playwright test tests/e2e/login-add-basket.spec.js

# With verbose logging
npx playwright test --reporter=verbose
```

### Strategy 2: Run in Headed Mode + Debug
```bash
# Combine headed + single worker
npx playwright test tests/e2e/login-add-basket.spec.js --headed --workers=1
```
- Browser opens so you can **watch the test execute**
- Easier to spot UI interaction failures

### Strategy 3: Use Playwright Inspector
```bash
# Step through test code interactively
npx playwright test --debug
```

**In the Inspector**:
- `Step over` — Execute next line
- `Step into` — Enter function
- `Evaluate` — Run JavaScript in page context
- `Resume` — Continue to next pause point

**Example workflow**:
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';

test('debug login', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  
  // Inspector pauses here
  debugger;
  
  await login.login();
  expect(page).toHaveURL(/inventory/);
});
```

Run with: `npx playwright test --debug`

### Strategy 4: Add Temporary Logging & Traces

```javascript
test('debug with logs', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  
  // Log page state
  console.log('Page URL:', page.url());
  console.log('Page title:', await page.title());
  
  await login.login();
  
  // Log after action
  const currentUrl = page.url();
  console.log('After login URL:', currentUrl);
  
  expect(currentUrl).toContain('inventory');
});
```

Run with: `npx playwright test --reporter=verbose`

### Strategy 5: Capture Screenshots & Videos
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';

test('capture debugging artifacts', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  
  // Screenshot before action
  await page.screenshot({ path: 'before-login.png' });
  
  await login.login();
  
  // Screenshot after action
  await page.screenshot({ path: 'after-login.png' });
  
  expect(page).toHaveURL(/inventory/);
});
```

Screenshots saved to `before-login.png`, `after-login.png` in project root.

### Strategy 6: Common Issues & Solutions

#### Issue: Element Not Found
```javascript
// ❌ PROBLEM: Selector doesn't exist or has changed
const item = page.locator('.old-selector-that-no-longer-exists');
await item.click(); // Error: No elements found

// ✅ SOLUTION 1: Inspect element in DevTools
// Open https://www.saucedemo.com in browser, inspect element, copy selector

// ✅ SOLUTION 2: Log all matching elements
const items = page.locator('.inventory_item');
console.log('Found items:', await items.count());

// ✅ SOLUTION 3: Use more robust selector
const item = page.locator('.inventory_item:has-text("Sauce Labs Backpack")');
```

#### Issue: Timeout (Element Not Visible)
```javascript
// ❌ PROBLEM: Element takes time to appear
await page.click('#checkout'); // Timeout waiting for element

// ✅ SOLUTION 1: Increase timeout
await page.click('#checkout', { timeout: 10000 }); // 10 seconds

// ✅ SOLUTION 2: Wait for element first
await page.waitForSelector('#checkout', { timeout: 10000 });
await page.click('#checkout');

// ✅ SOLUTION 3: Wait for visibility
await expect(page.locator('#checkout')).toBeVisible({ timeout: 10000 });
await page.click('#checkout');
```

#### Issue: Assertion Fails Intermittently (Flaky Test)
```javascript
// ❌ PROBLEM: Race condition - cart count updates slowly
await products.addToCartByName('Sauce Labs Backpack');
expect(await products.getCartBadgeCount()).toBe(1); // Sometimes fails

// ✅ SOLUTION: Use expect() with auto-retry
await products.addToCartByName('Sauce Labs Backpack');
await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
// Retries automatically for 5s (default timeout)
```

#### Issue: Test Passes Locally But Fails in CI
```javascript
// ❌ PROBLEM: Hardcoded waits don't work in CI
await page.goto('https://www.saucedemo.com');
await page.waitForTimeout(1000); // Not reliable in CI

// ✅ SOLUTION: Use explicit waits
await page.goto('https://www.saucedemo.com');
await expect(page.locator('.inventory_item')).toBeVisible();
// Playwright waits intelligently
```

---

## Part 4: Writing New Tests

### Test Template (Copy & Paste)
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import ProductsPage from '../../src/pages/ProductsPage.js';

test('describe the business workflow being tested', async ({ page }) => {
  // SETUP: Prepare test state (login, navigate, etc.)
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  // ACTION: Execute the feature/workflow
  const products = new ProductsPage(page);
  await products.addToCartByName('Sauce Labs Backpack');

  // ASSERT: Verify expected outcome
  expect(await products.getCartBadgeCount()).toBe(1);
});
```

### Test Naming Convention
```javascript
// ✅ GOOD: Clear business intent
test('add product to cart increases badge count', ...)
test('checkout with valid info completes order', ...)
test('login with locked account shows error', ...)

// ❌ AVOID: Vague or technical
test('test flow', ...)
test('e2e scenario 1', ...)
test('click and verify', ...)
```

### Best Practices for New Tests

#### 1. Follow Arrange-Act-Assert Pattern
```javascript
test('verify product appears in cart', async ({ page }) => {
  // ARRANGE: Set up initial state
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();
  
  // ACT: Perform the action
  const products = new ProductsPage(page);
  const productName = 'Sauce Labs Fleece Jacket';
  await products.addToCartByName(productName);
  
  // ASSERT: Check the result
  await products.openCart();
  const basket = new BasketPage(page);
  const items = await basket.getProductNames();
  expect(items).toContain(productName);
});
```

#### 2. Use Page Objects (Don't Interact Directly with `page`)
```javascript
// ❌ AVOID: Direct page interaction in tests
test('bad test', async ({ page }) => {
  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('#login-button');
  expect(page.url()).toContain('inventory');
});

// ✅ GOOD: Use Page Object
test('good test', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();
  expect(page).toHaveURL(/inventory/);
});
```

#### 3. Parameterize Test Data (Avoid Hard-Coding)
```javascript
// ❌ AVOID: Hard-coded data scattered in test
test('login with different users', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/');
  
  await login.login('standard_user', 'secret_sauce'); // Hard-coded
  expect(page).toHaveURL(/inventory/);
});

// ✅ GOOD: Use test parameterization
test.each([
  { user: 'standard_user', pass: 'secret_sauce', shouldPass: true },
  { user: 'locked_out_user', pass: 'secret_sauce', shouldPass: false }
])('login with $user', async ({ page }, testData) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login(testData.user, testData.pass);
  
  if (testData.shouldPass) {
    expect(page).toHaveURL(/inventory/);
  } else {
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  }
});
```

#### 4. Make Assertions Business-Focused
```javascript
// ❌ AVOID: Low-level technical assertions
test('cart badge test', async ({ page }) => {
  await products.addToCartByName('Sauce Labs Backpack');
  const text = await page.innerText('.shopping_cart_badge');
  const count = Number(text);
  expect(count).toEqual(1);
});

// ✅ GOOD: Business-focused, reusable
test('adding one product updates cart count', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.addToCartByName('Sauce Labs Backpack');
  expect(await products.getCartBadgeCount()).toBe(1);
});
```

#### 5. Use Semantic Assertions
```javascript
// ✅ Use Playwright's rich matchers
expect(page).toHaveURL(/inventory/);
expect(page.locator('#error')).toBeVisible();
expect(page.locator('.product')).toHaveCount(6);
expect(page.locator('text=Total:')).toContainText('$');
expect(page.locator('input[name="first-name"]')).toHaveValue('');

// Auto-retry for up to 5 seconds (configurable)
await expect(page.locator('.loading')).not.toBeVisible();
```

---

## Part 5: Creating a New Page Object

### Step 1: Identify the Page/Feature
Example: Inventory page with filtering

### Step 2: Create the Page Object File
Create `src/pages/InventoryPage.js`:

```javascript
import BasePage from './BasePage.js';

export default class InventoryPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.filterDropdown = '.product_sort_container';
    this.filterOptions = 'select option';
    this.productItems = '.inventory_item';
    this.productName = '.inventory_item_name';
    this.productPrice = '.inventory_item_price';
  }

  // Actions
  async sortBy(option) {
    // option: 'az', 'za', 'lohi', 'hilo'
    await this.page.selectOption(this.filterDropdown, option);
  }

  // Getters
  async getProductCount() {
    return this.page.locator(this.productItems).count();
  }

  async getProductNames() {
    return this.page.locator(this.productName).allTextContents();
  }

  async getProductPrices() {
    const prices = await this.page.locator(this.productPrice).allTextContents();
    return prices.map(p => parseFloat(p.replace('$', '')));
  }

  // Utilities
  async isProductVisible(name) {
    return this.page.locator(`.inventory_item:has-text("${name}")`).isVisible();
  }
}
```

### Step 3: Use in a Test
Create `tests/e2e/filter-inventory.spec.js`:

```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import InventoryPage from '../../src/pages/InventoryPage.js';

test('filter products by price (low to high)', async ({ page }) => {
  // Setup
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  // Action
  const inventory = new InventoryPage(page);
  await inventory.sortBy('lohi');

  // Assert
  const prices = await inventory.getProductPrices();
  for (let i = 1; i < prices.length; i++) {
    expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
  }
});
```

### Page Object Template Checklist
- ✅ Extends `BasePage`
- ✅ Defines selectors as instance variables
- ✅ All selectors use best-practice strategy (data-test-id → CSS → ID)
- ✅ Methods have clear, business-focused names
- ✅ No test logic in Page Object (only UI interactions)
- ✅ Return types are clear (boolean, string, number, object)
- ✅ Methods are documented with JSDoc (optional but helpful)

---

## Part 6: Test Data Management

### Using Default Test Credentials
```javascript
// The Sauce Labs demo provides these built-in users:
const validUser = {
  username: 'standard_user',
  password: 'secret_sauce'
};

const lockedOutUser = {
  username: 'locked_out_user',
  password: 'secret_sauce'
};

// Use in tests:
const login = new LoginPage(page);
await login.login(validUser.username, validUser.password);
```

### Parameterized Test Data
```javascript
test.each([
  { firstName: 'John', lastName: 'Doe', zipCode: '12345', valid: true },
  { firstName: '', lastName: 'Doe', zipCode: '12345', valid: false },
  { firstName: 'Jane', lastName: '', zipCode: '12345', valid: false },
])('checkout with data', async ({ page }, data) => {
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();
  
  // ... add product to cart ...
  
  const checkout = new CheckoutPage(page);
  await checkout.startCheckout();
  await checkout.fillInfo(data.firstName, data.lastName, data.zipCode);
  
  if (data.valid) {
    expect(await checkout.isFinished()).toBeTruthy();
  } else {
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  }
});
```

### Avoiding Hard-Coded Sensitive Data
```javascript
// ❌ AVOID: Hard-coded passwords in test files
test('login', async ({ page }) => {
  await page.fill('#user-name', 'admin@company.com');
  await page.fill('#password', 'MySecurePassword123!'); // EXPOSED
});

// ✅ GOOD: Use environment variables or config
test('login', async ({ page }) => {
  const username = process.env.TEST_USERNAME || 'standard_user';
  const password = process.env.TEST_PASSWORD || 'secret_sauce';
  
  const login = new LoginPage(page);
  await login.login(username, password);
});
```

---

## Part 7: CI/CD Integration

### GitHub Actions Workflow
Tests run automatically on:
- **Push to `main` branch**
- **Pull requests**

### View CI Results
1. Go to repository on GitHub
2. Click **Actions** tab
3. Select the workflow run
4. View test results and download artifacts

### Local Reproduction of CI Failure
```bash
# Run in same conditions as CI (headless, parallel, no debug)
npm test

# If specific test fails, debug locally
npx playwright test <test-file> --headed
```

### Environment Variables in CI
```yaml
# .github/workflows/test.yml
env:
  BASE_URL: https://www.saucedemo.com
  NODE_ENV: test
```

Access in tests:
```javascript
const baseURL = process.env.BASE_URL || 'https://www.saucedemo.com';
```

---

## Part 8: Tips & Tricks

### Increase Timeout for Slow Tests
```bash
# Globally increase timeout to 60 seconds
npx playwright test --timeout=60000

# Or in playwright.config.js:
timeout: 60000
```

### Retry Flaky Tests
```bash
# Retry failed tests up to 3 times
npx playwright test --retries=3
```

Or in playwright.config.js:
```javascript
export const defineConfig = {
  retries: 2
};
```

### Generate a Test Trace
```bash
npx playwright test --trace=on

# Open trace (generates .zip file with detailed execution info)
npx playwright show-trace path/to/trace.zip
```

### Run Tests Against Different Base URL
```bash
# Staging environment
BASE_URL=https://staging.saucedemo.com npm test

# Development environment
BASE_URL=http://localhost:3000 npm test
```

### Check for Unused Selectors
Before merging, verify selectors are valid:
```bash
# Run with headed mode to visually confirm selectors work
npm run test:headed

# Or use Playwright Inspector
npx playwright test --debug
```

---

## Troubleshooting Checklist

| Problem | Diagnosis | Solution |
|---------|-----------|----------|
| Tests pass locally, fail in CI | Environment difference | Check BASE_URL, credentials, network |
| Selector not found | Element missing or changed | Inspect DOM, update selector in POM |
| Timeout waiting for element | Element too slow to appear | Increase timeout, check for lazy loading |
| Flaky tests (intermittent failures) | Race condition or timing | Use `expect().toBeVisible()` with retry |
| Too slow in CI | Parallelization not working | Check `--workers` setting |
| Can't debug tests | Need visibility into execution | Use `npm run test:headed` or `--debug` |

---

## Quick Reference: Common Commands

```bash
# Run tests
npm test                                    # All tests, headless
npm run test:headed                         # All tests, headed mode
npx playwright test <file>                  # Specific test file
npx playwright test -g "pattern"            # By test name pattern

# Debug & troubleshoot
npx playwright test --debug                 # Step through code
npm run test:headed                         # Watch execution
npx playwright test --reporter=verbose      # Detailed output

# Reports
npm run test:report                         # Playwright HTML report
npm run test:allure && npm run allure:open # Allure report

# Environment
npx playwright install                      # Install browsers
npm install                                 # Install dependencies
```

---

## Next Steps
1. ✅ Run `npm install && npx playwright install`
2. ✅ Run `npm test` and verify all tests pass
3. ✅ Open `npm run test:report` and explore the report
4. ✅ Pick a test file and run it in headed mode: `npm run test:headed`
5. ✅ Create a new test using the template above
6. ✅ Submit a PR with your new test!

**Questions?** Check the test files for examples, or use `npx playwright test --debug` to explore interactively.
