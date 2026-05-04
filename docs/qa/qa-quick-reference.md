# QA Team Quick Reference

A fast lookup guide for common QA tasks and troubleshooting.

---

## Running Tests

### Quick Commands
```bash
npm test                        # Run all tests (fastest, headless)
npm run test:headed             # Run with browser visible (slower, debug-friendly)
npm run test:report             # View HTML report of last run
npm run test:allure && npm run allure:open  # Generate & view Allure report
```

### Run Specific Tests
```bash
npx playwright test tests/e2e/login*.spec.js    # All login tests
npx playwright test -g "add product"             # Tests matching pattern
npx playwright test tests/e2e/checkout.spec.js   # Single file
```

### Debug & Troubleshoot
```bash
npx playwright test --debug                      # Step through test code
npm run test:headed                              # Watch test execution visually
npx playwright test --reporter=verbose           # Detailed output
```

---

## Page Objects Map

### Quick Reference: What Page Object Does What?

| Page | Purpose | Key Methods |
|------|---------|-------------|
| **LoginPage** | Authentication | `login(user, pass)` |
| **ProductsPage** | Browsing & cart | `addToCartByName()`, `getCartBadgeCount()`, `openCart()` |
| **BasketPage** | View cart items | `getProductNames()` |
| **CheckoutPage** | Order flow | `fillInfo()`, `finish()`, `isFinished()` |
| **ProductDetailsPage** | Product info | `openByName()`, `getDetails()`, `addToCart()` |

### Using Page Objects in Tests
```javascript
// Import
import LoginPage from '../../src/pages/LoginPage.js';

// Instantiate
const login = new LoginPage(page);

// Use
await login.goto('/');
await login.login('standard_user', 'secret_sauce');
```

---

## Test Naming Convention

### ✅ Good Test Names (Clear Intent)
- `user can add backpack to cart`
- `login fails for locked account`
- `checkout requires first name`
- `products sort ascending A to Z`

### ❌ Bad Test Names (Vague)
- `test 1`, `test flow`, `basic test`
- `e2e scenario`
- `click and verify`

---

## Debugging Failing Tests

### Symptom: "Element not found"
```
Error: Timeout waiting for element .inventory_item_name
```

**Quick Fix**:
1. Check selector is correct: Open saucedemo.com in browser, inspect element
2. Use more robust selector: `.inventory_item:has-text("Product Name")`
3. Verify element loads: Use `expect(page.locator(...)).toBeVisible()`

### Symptom: "Assertion failed"
```
Expected: 1
Received: 0
```

**Quick Fix**:
1. Run in headed mode: `npm run test:headed`
2. Check cart badge updates after adding product
3. Add screenshot: `await page.screenshot({ path: 'debug.png' });`

### Symptom: "Test passes locally, fails in CI"
**Quick Fix**:
1. Verify `baseURL` is correct for CI environment
2. Remove hard-coded `page.waitForTimeout()` calls
3. Use explicit waits: `await expect(...).toBeVisible()`

### Symptom: "Intermittent failures"
**Quick Fix**:
1. Increase timeout: `expect(..., { timeout: 10000 })`
2. Use auto-retry: `await expect(page.locator('...')).toContainText('...')`
3. Check for flaky selectors (e.g., based on element order)

---

## Test Data

### Valid Test Users (Sauce Labs Demo)
| User | Password | Result |
|------|----------|--------|
| `standard_user` | `secret_sauce` | ✅ Logs in successfully |
| `locked_out_user` | `secret_sauce` | 🔒 Account locked (error) |
| `problem_user` | `secret_sauce` | ⚠️ UI rendering issues |

### Valid Checkout Data
```javascript
firstName: 'John'
lastName: 'Doe'
zipCode: '12345'
```

### Product Names (Available After Login)
1. Sauce Labs Backpack
2. Sauce Labs Bike Light
3. Sauce Labs Bolt T-Shirt
4. Sauce Labs Fleece Jacket
5. Sauce Labs Onesie
6. Test.allTheThings() T-Shirt (Red)

---

## Test Execution Times

| Test | Duration | Notes |
|------|----------|-------|
| `login-add-basket.spec.js` | ~1-2s | Fast, simple flow |
| `checkout.spec.js` | ~2-3s | Includes form filling |
| `sorting.spec.js` | ~2s | Quick DOM operations |
| **All 7 tests** | ~8-12s | Parallel execution |

**Expected**: Full suite runs in <15 seconds

---

## Reports

### Playwright HTML Report
```bash
npm run test:report
```
- Shows pass/fail/skip
- Screenshots on failure
- Execution timeline
- Video recordings (optional)

### Allure Report
```bash
npm run test:allure        # Run tests with Allure
npm run allure:generate    # Generate report
npm run allure:open        # Open in browser
```
- Test trends over time
- Failure breakdown
- Duration analysis
- Historical comparison

---

## CI/CD

### Tests Run Automatically On:
- 🔀 Push to `main` branch
- 📋 Pull requests

### To Check CI Results:
1. Go to GitHub repo → **Actions** tab
2. Select workflow run
3. View test output and artifacts

### If CI Fails But Local Passes:
```bash
# Reproduce CI conditions (headless, parallel)
npm test

# If still fails, debug specific test
npx playwright test <failing-test> --headed
```

---

## Coverage & Gaps

### Current Coverage: 50%
- ✅ 7 tests written
- ❌ 9 workflows still need tests

### High Priority Gaps:
1. **Form validation** - Checkout with missing fields
2. **Cart persistence** - Items survive page refresh
3. **Security** - Prevent unauthorized access

**Next goal**: Add 6 tests to reach 75% coverage

See `/docs/qa/coverage-mapping.md` for full details.

---

## Common Commands Cheat Sheet

```bash
# SETUP
npm install                     # Install dependencies (first time)
npx playwright install          # Install browsers (first time)

# RUN TESTS
npm test                        # Fast headless run
npm run test:headed             # Visible browser (debug-friendly)
npx playwright test -g "login"  # Tests matching keyword
npx playwright test --debug     # Interactive debugger

# VIEW RESULTS
npm run test:report             # HTML report
npm run allure:open             # Allure dashboard

# TROUBLESHOOT
npx playwright test --reporter=verbose  # Detailed output
npx playwright test --retries=3         # Retry failed tests
BASE_URL=http://localhost:3000 npm test # Different environment
```

---

## When to Escalate

### ⚠️ Contact DevOps If:
- Tests fail consistently in CI but pass locally
- HTML reports or Allure reports not generating
- Test execution is much slower than expected

### ⚠️ Contact Dev Team If:
- Selectors break (elements not found)
- App behavior changes unexpectedly
- New feature needs new page object

### ⚠️ Contact QA Lead If:
- Test coverage seems incomplete
- New test scenarios needed
- Need guidance on test strategy

---

## References

- **Full Framework Guide**: `/docs/architecture/test-framework.md`
- **Developer Setup**: `/docs/onboarding/developer-guide.md`
- **Coverage Map**: `/docs/qa/coverage-mapping.md`
- **AI Skills**: `/docs/qa/ai-skills.md`
- **Playwright Docs**: https://playwright.dev

---

## Tips & Tricks

### Speed Up Local Test Run
```bash
npx playwright test --workers=8  # Use more parallel workers
npx playwright test -g "quick"   # Run only tagged tests
```

### Capture Debug Info
```javascript
// In test code:
console.log('Page URL:', page.url());
await page.screenshot({ path: 'screenshot.png' });
```

### View Video of Failed Test
```bash
# Enable in playwright.config.js:
use: { video: 'retain-on-failure' }

# Video saved to: test-results/
```

### Run Against Different Environment
```bash
BASE_URL=https://staging.saucedemo.com npm test
BASE_URL=http://localhost:3000 npm test
```

### Check Test Coverage Progress
```bash
# See all tests in matrix
grep -r "test(" tests/e2e/*.spec.js | wc -l

# Open Allure report for trending
npm run allure:open
```

---

**Last Updated**: 2026-05-04  
**Framework**: Playwright 1.35.0+  
**Test Count**: 7  
**Coverage**: 50%
