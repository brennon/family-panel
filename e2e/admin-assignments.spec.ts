import { test, expect } from '@playwright/test';
import { getTestUsers } from './fixtures/test-users';
import { format } from 'date-fns';

/**
 * Admin Chore Assignment E2E tests
 * Tests the parent admin UI for assigning chores to kids
 *
 * PREREQUISITES:
 * Same as auth.spec.ts - requires test database with migrations applied
 */
test.describe('Admin Chore Assignments', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    const users = getTestUsers(browserName);

    // Clear all cookies and storage
    await context.clearCookies();
    await page.goto('/login');

    // Log in as parent
    await page.getByLabel('Email').fill(users.parent.email);
    await page.getByLabel('Password').fill(users.parent.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Create a test chore if needed
    await page.goto('/admin/chores/new');
    const choreName = `Test Chore ${Date.now()}`;
    await page.getByLabel(/name/i).fill(choreName);
    await page.getByLabel(/description/i).fill('Test chore for assignments');
    await page.getByLabel(/value|amount|\$/i).fill('1.00');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL('/admin/chores');
  });

  test.afterEach(async ({ page, context }) => {
    try {
      await context.clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Ignore errors
    }
  });

  test('parent can navigate to assignments page', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to assignments (could be via menu or direct link)
    await page.goto('/admin/assignments');

    // Should see assignments page
    await expect(page.getByRole('heading', { name: /assignments|assign chores/i })).toBeVisible();
  });

  test('parent can view assignments for a date', async ({ page }) => {
    await page.goto('/admin/assignments');

    // Should see date selector or calendar
    // Page should show today's date by default or allow selecting a date
    const today = format(new Date(), 'MMMM d, yyyy');

    // Look for today's date or a date picker
    const hasDateDisplay = await page.getByText(new RegExp(today, 'i')).isVisible().catch(() => false);
    const hasDatePicker = await page.locator('input[type="date"]').isVisible().catch(() => false);

    expect(hasDateDisplay || hasDatePicker).toBe(true);
  });

  test('parent can assign a chore to a kid', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);
    await page.goto('/admin/assignments');

    // Fill in assignment form
    // Select kid from dropdown
    await page.getByLabel(/kid|child|name/i).click();
    await page.getByRole('option', { name: new RegExp(users.kid1.name, 'i') }).click();

    // Select date (use today)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const dateInput = page.getByLabel(/date/i);
    await dateInput.fill(todayStr);

    // Select chore from dropdown
    await page.getByLabel(/chore/i).click();
    // Click first available chore option
    await page.locator('[role="option"]').first().click();

    // Submit assignment
    await page.getByRole('button', { name: /assign|add assignment/i }).click();

    // Should show success message or updated list
    await expect(page.getByText(/assigned|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('parent can see existing assignments for a date', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);

    // First create an assignment
    await page.goto('/admin/assignments');

    await page.getByLabel(/kid|child|name/i).click();
    await page.getByRole('option', { name: new RegExp(users.kid1.name, 'i') }).click();

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await page.getByLabel(/date/i).fill(todayStr);

    await page.getByLabel(/chore/i).click();
    await page.locator('[role="option"]').first().click();

    await page.getByRole('button', { name: /assign|add assignment/i }).click();

    // Wait for assignment to be created
    await page.waitForTimeout(1000);

    // Refresh or reload assignments view
    await page.reload();

    // Should see the assignment in the list
    await expect(page.getByText(users.kid1.name)).toBeVisible();
  });

  test('form validation works for assignments', async ({ page }) => {
    await page.goto('/admin/assignments');

    // Try to submit without selecting kid or chore
    await page.getByRole('button', { name: /assign|add assignment/i }).click();

    // Should show validation error
    await expect(page.getByText(/required|select|choose/i)).toBeVisible();
  });

  test('kids cannot access assignments page', async ({ page, context, browserName }) => {
    const users = getTestUsers(browserName);

    // Sign out parent
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL('/login');

    // Log in as kid
    await page.getByRole('button', { name: /kid login/i }).click();
    await page.getByLabel(/your name/i).fill(users.kid1.id);
    await page.getByLabel(/pin code/i).fill(users.kid1.pin);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Try to access assignments page
    await page.goto('/admin/assignments');

    // Should be redirected or see access denied
    const url = page.url();
    const hasError = await page.getByText(/access denied|not authorized|permission/i).isVisible().catch(() => false);

    expect(url === '/dashboard' || hasError).toBe(true);
  });
});
