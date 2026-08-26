# E2E Tests with Playwright

## Quick Start

```bash
# Install dependencies
npm install

# Install browsers
npx playwright install

# Run tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# View report
npm run test:e2e:report
```

## Test Files

- `e2e/home.spec.ts` - Homepage tests
- `e2e/auth/login.spec.ts` - Authentication tests

## Configuration

See `playwright.config.ts` for settings.

## CI/CD

Tests automatically run in GitHub Actions on:
- Push to `main` or `develop`
- Pull requests to `main`
