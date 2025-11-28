# E2E Testing with Playwright

This directory contains end-to-end tests for Family Panel using Playwright.

## Running Tests

### Headless Mode (CI/Automated)
```bash
npm run test:e2e
```
Runs all tests in headless mode across all configured browsers (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari).

### UI Mode (Interactive Testing)
```bash
npm run test:e2e:ui
```
Opens Playwright's interactive UI where you can:
- See all tests in a tree view
- Run individual tests
- Step through tests
- Inspect test traces
- View screenshots and videos

### Headed Mode (Development Observation)
```bash
npm run test:e2e:headed
```
Runs tests with visible browser windows. Useful for:
- Observing test behavior in real-time
- Debugging visual issues
- Demonstrating features to Claude Code
- Visual verification during development

### Debug Mode (Step-by-Step)
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging:
- Set breakpoints
- Step through test actions
- Inspect page state
- View selector suggestions
- Execute commands in console

## Running Specific Tests

### Run a single test file
```bash
npx playwright test homepage.spec.ts
```

### Run tests in a specific project (browser)
```bash
npx playwright test --project=chromium
```

### Run tests matching a pattern
```bash
npx playwright test --grep "should display"
```

## Writing New Tests

### Test File Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/some-page');

    // Interact
    await page.click('button');

    // Assert
    await expect(page.getByText('Expected text')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Semantic Selectors**
   ```typescript
   // Good: Use role-based selectors
   page.getByRole('button', { name: 'Submit' })
   page.getByRole('heading', { name: 'Welcome' })

   // Avoid: CSS selectors when possible
   page.locator('.submit-button')
   ```

2. **Wait for Elements**
   ```typescript
   // Playwright auto-waits, but for dynamic content:
   await page.waitForSelector('text=Data loaded');
   ```

3. **Take Screenshots for Documentation**
   ```typescript
   await page.screenshot({
     path: 'e2e/screenshots/feature-name.png',
     fullPage: true
   });
   ```

4. **Use test.skip for Future Tests**
   ```typescript
   test.skip('should have this feature later', async ({ page }) => {
     // TODO: Implement when feature is ready
   });
   ```

5. **Group Related Tests**
   ```typescript
   test.describe('User Authentication', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto('/login');
     });

     test('login as parent', async ({ page }) => {
       // Test code
     });

     test('login as kid', async ({ page }) => {
       // Test code
     });
   });
   ```

## Test Configuration

Configuration is in `playwright.config.ts` at the project root.

### Key Settings
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 30s per test (can be adjusted)
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Trace**: Captured on first retry

### Web Server
The config automatically starts `npm run dev` before tests and shuts it down after.

## Test Artifacts

### Test Results
Generated in `test-results/` directory (gitignored):
- Screenshots on failure
- Videos on failure
- Traces for debugging

### HTML Report
After running tests, view the HTML report:
```bash
npx playwright show-report
```

### Screenshots
Intentional screenshots are saved to `e2e/screenshots/` (gitignored).

## CI Integration

Tests run automatically in CI with:
- Headless mode
- All browsers
- 2 retries for flaky tests
- HTML report artifacts

## Debugging Tips

1. **Use Playwright Inspector**
   ```bash
   npm run test:e2e:debug
   ```

2. **Use console.log in tests**
   ```typescript
   await page.evaluate(() => console.log('Debug info'));
   ```

3. **Pause execution**
   ```typescript
   await page.pause(); // Opens inspector
   ```

4. **View trace files**
   After a failure, view the trace:
   ```bash
   npx playwright show-trace test-results/path-to-trace.zip
   ```

## Example Test Flows

### Authentication Flow
```typescript
test('parent login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'parent@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Chore Assignment Flow
```typescript
test('assign chore to kid', async ({ page, context }) => {
  // Login as parent
  await page.goto('/login');
  // ... login steps ...

  // Navigate to chores
  await page.goto('/chores');

  // Create new chore
  await page.click('button:has-text("New Chore")');
  await page.fill('input[name="title"]', 'Clean room');
  await page.selectOption('select[name="assignee"]', 'kid-id');
  await page.fill('input[name="points"]', '10');
  await page.click('button[type="submit"]');

  // Verify chore appears
  await expect(page.getByText('Clean room')).toBeVisible();
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
