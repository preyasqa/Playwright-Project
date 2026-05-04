# Test Framework Architecture

## Overview
This is a **Playwright-based E2E Test Suite** targeting the Sauce Labs Demo Application (`https://www.saucedemo.com`). The architecture follows the **Page Object Model (POM)** pattern with a layered structure separating test logic from UI interaction code.

---

## 1. Test Solution Structure

### Project Layout
```
saucedemo-playwright-copilot/
├── src/
│   └── pages/                    # Page Object Models
│       ├── BasePage.js           # Base class for all pages
│       ├── LoginPage.js          # Login & auth flows
│       ├── ProductsPage.js       # Product listing & cart operations
│       ├── BasketPage.js         # Cart view & item inspection
│       ├── CheckoutPage.js       # Checkout form & order completion
│       └── ProductDetailsPage.js # Product detail view
├── tests/
│   └── e2e/                      # End-to-end test specs
│       ├── login-add-basket.spec.js
│       ├── checkout.spec.js
│       ├── invalid-login.spec.js
│       ├── product-details.spec.js
│       ├── sorting.spec.js
│       ├── add-multiple-remove.spec.js
│       └── logout.spec.js
├── playwright.config.js          # Playwright configuration
├── package.json                  # Dependencies & scripts
├── allure-results/               # Allure report artifacts
├── allure-report/                # Allure HTML report
└── docs/
    └── architecture/
        └── test-framework.md     # This file
```

### Key Characteristics
| Aspect | Detail |
|--------|--------|
| **Framework** | Playwright 1.35.0+ |
| **Language** | JavaScript (ESM modules) |
| **Pattern** | Page Object Model (POM) |
| **Tests** | 7 end-to-end scenarios |
| **Test Runner** | Playwright Test |
| **Reporters** | HTML, Allure |
| **Target** | Sauce Labs Demo (saucedemo.com) |

---

## 2. Automation Frameworks & Tools

### Playwright & Dependencies
```json
{
  "@playwright/test": "^1.35.0",      // E2E test runner + assertions
  "allure-commandline": "^2.38.1",    // Allure report generation
  "allure-playwright": "^2.1.0"       // Allure reporter plugin
}
```

### Key Capabilities
- **Browser Support**: Chromium, Firefox, WebKit (via Playwright)
- **Assertions**: Playwright's built-in `expect()` API
- **Selectors**: CSS selectors + dynamic locators with `:has-text()`
- **Wait Handling**: Automatic waits (5s action timeout, 30s test timeout)
- **Screenshots/Videos**: HTML report captures on failure

---

## 3. Page Object Model (POM) Design

### Base Class: `BasePage.js`
All page objects inherit from `BasePage`, which provides:
```javascript
export default class BasePage {
  constructor(page) {
    this.page = page;  // Playwright Page object
  }

  async goto(path = '/') {
    await this.page.goto(path);
  }

  async title() {
    return this.page.title();
  }
}
```

**Purpose**: 
- Centralize navigation (`goto()`)
- Provide common page utilities
- Reduce duplication across page objects

---

### Page Object: `LoginPage.js`
**Scope**: Authentication workflows

```javascript
export default class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.username = '#user-name';
    this.password = '#password';
    this.loginButton = '#login-button';
  }

  async login(user = 'standard_user', pass = 'secret_sauce') {
    await this.page.fill(this.username, user);
    await this.page.fill(this.password, pass);
    await this.page.click(this.loginButton);
  }
}
```

**Responsibilities**:
- Encapsulate login form selectors
- Provide reusable `login()` method with default credentials
- Enable parameterized testing (different users, error scenarios)

**Credentials (Sauce Labs Test Data)**:
- `standard_user` / `secret_sauce` → Valid login
- `locked_out_user` / `secret_sauce` → Auth error

---

### Page Object: `ProductsPage.js`
**Scope**: Product listing, cart operations, sorting

```javascript
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
```

**Key Design Patterns**:
- **Dynamic Locators**: `:has-text("${name}")` for product selection (resilient to order changes)
- **Null-Safe Checks**: `getCartBadgeCount()` handles missing badge (empty cart)
- **Semantic Methods**: `addToCartByName()` reads like a business action, not technical detail

---

### Page Object: `BasketPage.js`
**Scope**: Cart view, item retrieval

```javascript
export default class BasketPage extends BasePage {
  constructor(page) {
    super(page);
    this.cartItemNames = '.cart_item .inventory_item_name';
  }

  async getProductNames() {
    return this.page.locator(this.cartItemNames).allTextContents();
  }
}
```

**Single Responsibility**: Focused on cart data extraction.

---

### Page Object: `CheckoutPage.js`
**Scope**: Checkout form, order completion

```javascript
export default class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstName = '#first-name';
    this.lastName = '#last-name';
    this.postal = '#postal-code';
    this.continueBtn = '#continue';
    this.finishBtn = '#finish';
    this.completeHeader = '.complete-header';
  }

  async startCheckout() {
    await this.page.click('.checkout_button, #checkout');
  }

  async fillInfo(first = 'John', last = 'Doe', postal = '12345') {
    await this.page.fill(this.firstName, first);
    await this.page.fill(this.lastName, last);
    await this.page.fill(this.postal, postal);
    await this.page.click(this.continueBtn);
  }

  async finish() {
    await this.page.click(this.finishBtn);
  }

  async isFinished() {
    return this.page.isVisible(this.completeHeader);
  }
}
```

**Design Notes**:
- **Default Test Data**: `fillInfo()` provides sensible defaults for reusability
- **Composed Actions**: `fillInfo()` combines input + navigation (reduces test boilerplate)
- **State Verification**: `isFinished()` confirms order completion (assertion-friendly)

---

### Page Object: `ProductDetailsPage.js`
**Scope**: Product detail view, product selection

```javascript
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
```

**Design Highlights**:
- **CSS Selector Alternatives**: Button selector accommodates multiple variants
- **Data Objects**: `getDetails()` returns structured object (testable, reusable)

---

## 4. Test Execution Workflow

### Local Execution
```bash
# Install dependencies
npm install
npx playwright install

# Run all tests (headless)
npm test

# Run tests in headed mode (browser window visible)
npm run test:headed

# Run specific test file
npx playwright test tests/e2e/login-add-basket.spec.js

# Run with specific browser
npx playwright test --project=chromium

# Debug mode (step through code)
npx playwright test --debug
```

### Configuration (`playwright.config.js`)
```javascript
export default defineConfig({
  testDir: 'tests',                                    // Test discovery path
  timeout: 30000,                                      // Per-test timeout (30s)
  expect: { timeout: 5000 },                           // Assertion timeout (5s)
  reporter: [['list'], ['html', { open: 'never' }]],  // Reporters
  use: {
    headless: true,                                    // Run headless by default
    actionTimeout: 5000,                               // Click/fill timeout (5s)
    baseURL: 'https://www.saucedemo.com'              // Base URL
  }
});
```

### Parallelization
- **Default**: Tests run in parallel (multiple workers)
- **Workers**: Controlled by `--workers=n` flag
- **Test Isolation**: Each test gets isolated browser context
- **CI Compatibility**: GitHub Actions uses parallel execution

---

## 5. Reporting & Logging

### Playwright HTML Report
```bash
npm run test:report
# Generates: playwright-report/index.html
# Includes: Test results, traces, screenshots
```

### Allure Report
```bash
npm run test:allure           # Run tests with Allure reporter
npm run allure:generate       # Generate Allure HTML report
npm run allure:open           # Open Allure report locally
```

**Report Artifacts**:
- `allure-results/` — Raw test data (JSON + attachments)
- `allure-report/` — Generated HTML dashboard

**Allure Features**:
- Test execution timeline
- Pass/fail/skip breakdown
- Historical trends
- Error categorization
- Screenshot attachments

---

## 6. Test Data & Configuration

### Credentials (Public Test Data)
The Sauce Labs demo provides **built-in test users**:
| User | Password | Status |
|------|----------|--------|
| `standard_user` | `secret_sauce` | Valid login |
| `locked_out_user` | `secret_sauce` | Account locked |
| `problem_user` | `secret_sauce` | UI rendering issues |
| `performance_glitch_user` | `secret_sauce` | Slow performance |

**Source**: https://www.saucedemo.com

### Test Data Seeding
- **No test data seeding required** (public demo with pre-populated products)
- **Products**: Static inventory (6 items) automatically available post-login
- **Cleanup**: Not required (stateless public demo)

### Environment Configuration
```javascript
// playwright.config.js
baseURL: 'https://www.saucedemo.com'  // Single target environment
```

**Extensibility**: For multi-environment support, use environment variables:
```javascript
const baseURL = process.env.BASE_URL || 'https://www.saucedemo.com';
```

---

## 7. Known Risks & Gaps

### Current Limitations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Static Test Data** | No negative input validation | Add parameterized invalid data tests |
| **Single Environment** | No staging/QA coverage | Extend config for env-specific URLs |
| **No API Tests** | UI-only coverage | Consider API testing for auth/cart endpoints |
| **Limited Error Scenarios** | Only 1 auth failure case | Add network failures, timeouts, permission errors |
| **Selector Brittleness** | Updates to saucedemo.com break tests | Monitor selector health, use data-test attributes |

### Coverage Gaps
| Workflow | Status | Gap |
|----------|--------|-----|
| Login (success) | ✅ Covered | |
| Login (failure) | ✅ Covered | Multi-error scenarios (network, validation) |
| Product browsing | ✅ Covered | Filtering, search, pagination |
| Cart operations | ✅ Covered | Quantity updates, discounts |
| Checkout | ✅ Covered | Form validation, payment methods |
| Sorting | ✅ Covered | Price filtering, advanced search |
| Logout | ✅ Covered | Session validation |

---

## 8. Stability & Maintenance

### Best Practices Implemented
✅ **Page Object Encapsulation** — Selectors centralized (1 place to update)  
✅ **Smart Waits** — Playwright auto-waits (no explicit `sleep()` calls)  
✅ **Null-Safe Methods** — `getCartBadgeCount()` handles missing elements  
✅ **Dynamic Selectors** — `:has-text()` finds elements by content  
✅ **Meaningful Assertions** — Business-focused (e.g., "is product in cart?")

### Flaky Test Prevention
1. **Avoid Hard Sleeps** — Use Playwright's auto-waits
2. **Strong Selectors** — Use `data-test-id` if available, else CSS
3. **Idempotent Tests** — Each test runs independently
4. **Explicit Waits** — `expect(...).toBeVisible()` waits for visibility

### Selector Strategy
| Selector Type | Priority | Example |
|---------------|----------|---------|
| `data-test-id` | 1st | `[data-test="error"]` |
| CSS Class | 2nd | `.inventory_item_name` |
| ID | 3rd | `#login-button` |
| Dynamic `:has-text()` | Last Resort | `.item:has-text("Product Name")` |

---

## 9. Continuous Integration

### GitHub Actions Workflow
Tests execute on:
- Push to `main` branch
- Pull requests

**CI Process**:
1. Install Node.js dependencies (`npm install`)
2. Install Playwright browsers (`npx playwright install`)
3. Run tests in headless mode (`npm test`)
4. Upload Playwright HTML report as artifact
5. Upload Allure results as artifact
6. Generate Allure report (optional post-run step)

**Artifact Retention**: Reports available for 30 days (GitHub default)

---

## 10. Adding New Tests

### Template for New E2E Test
```javascript
import { test, expect } from '@playwright/test';
import LoginPage from '../../src/pages/LoginPage.js';
import [PageObject] from '../../src/pages/[PageObject].js';

test('describe what the test validates', async ({ page }) => {
  // SETUP: Login
  const login = new LoginPage(page);
  await login.goto('/');
  await login.login();

  // ACTION: Perform business workflow
  const pageObj = new [PageObject](page);
  await pageObj.[action]();

  // ASSERT: Validate expected outcome
  expect(await pageObj.[getter]()).toBe(expectedValue);
});
```

### Adding a New Page Object
1. Create `src/pages/[FeatureName]Page.js`
2. Extend `BasePage`
3. Define selectors as class properties
4. Add public async methods for user workflows
5. Use in tests via constructor injection

---

## Summary

This framework prioritizes:
- **Maintainability** via Page Objects
- **Reliability** via Playwright's smart waits
- **Clarity** via semantic method names
- **Reusability** via test data builders and utilities
- **Visibility** via comprehensive reporting (HTML + Allure)

**Next Steps**: Review coverage gaps, consider API testing, and expand multi-environment support.
