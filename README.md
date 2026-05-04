Playwright E2E tests (JavaScript)

This project contains a sample Playwright JS setup and page objects (Login, Products, Basket, Checkout, ProductDetails) with 7 E2E tests covering basic user flows on https://www.saucedemo.com.

## Tests
- Login success/failure
- Add/remove products from cart
- Product details verification
- Checkout flow
- Logout
- Sorting (A-Z, Z-A)

## Quick start

```bash
npm install
npx playwright install
npm test
```

## Reports

### Playwright HTML Report
```bash
npx playwright show-report
```

### Allure Report
```bash
npm run test:allure
npm run allure:generate
npm run allure:open
```

## CI
Tests run automatically on push/PR to `main` via GitHub Actions. Artifacts (Playwright HTML and Allure results) are uploaded after each run.

Adjust selectors in `src/pages` if you want to test a different application.
