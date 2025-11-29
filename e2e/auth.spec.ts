import { test, expect } from '@playwright/test';
import { getTestUsers } from './fixtures/test-users';

/**
 * Authentication E2E tests
 * Tests the complete authentication flows for parents and kids
 *
 * PREREQUISITES:
 * 1. Wipe database completely
 * 2. Run all migrations in order:
 *    - 001_initial_schema.sql
 *    - 002_row_level_security.sql
 *    - 003_add_kid_pin.sql
 *    - 004_add_family_relationships.sql
 *    - 005_seed_test_data.sql
 *    - 006_grant_permissions.sql
 *    - 007_add_browser_specific_test_users.sql
 * 3. Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY set
 *
 * Test users: Each browser gets unique users to prevent cross-browser interference
 * Created by migrations 005 (shared) and 007 (browser-specific)
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage to ensure test isolation
    await context.clearCookies();
    await page.goto('/login');
  });

  test.afterEach(async ({ page, context }) => {
    // Clean up: clear all auth state
    try {
      // Clear all cookies and storage
      await context.clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Ignore errors if page is closed or navigation failed
    }
  });

  test('parent can log in with email and password', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);

    // Fill in parent login form
    await page.getByLabel('Email').fill(users.parent.email);
    await page.getByLabel('Password').fill(users.parent.password);

    // Submit form and wait for navigation
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Should show parent's name
    const nameRegex = new RegExp(users.parent.name, 'i');
    await expect(page.getByText(nameRegex).first()).toBeVisible({ timeout: 10000 });
  });

  test('kid can log in with PIN', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);

    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Wait for kid form to be visible
    await expect(page.getByLabel(/your name/i)).toBeVisible();

    // Fill in kid login form
    await page.getByLabel(/your name/i).fill(users.kid1.id);
    await page.getByLabel(/pin code/i).fill(users.kid1.pin);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard (dashboard can take 10-30s to load in dev mode)
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 });

    // Should show kid's name (use first() to handle multiple matches)
    const nameRegex = new RegExp(users.kid1.name, 'i');
    await expect(page.getByText(nameRegex).first()).toBeVisible();
  });

  test('session persists after page refresh', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);

    // Log in as parent
    await page.getByLabel('Email').fill(users.parent.email);
    await page.getByLabel('Password').fill(users.parent.password);

    // Submit form and wait for navigation
    // WebKit needs both URL change and load state wait
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Wait for user data to load
    const nameRegex = new RegExp(users.parent.name, 'i');
    await expect(page.getByText(nameRegex).first()).toBeVisible({ timeout: 10000 });

    // Refresh page
    await page.reload();

    // Wait for page to finish loading (don't use networkidle - Supabase keeps connections open)
    await page.waitForLoadState('domcontentloaded');

    // Check we're still on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard');

    // User name should eventually appear (may take a moment for profile to load)
    await expect(page.getByText(nameRegex).first()).toBeVisible({ timeout: 10000 });
  });

  test('invalid PIN shows error', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);

    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Wait for kid form to be visible
    await expect(page.getByLabel(/your name/i)).toBeVisible();

    // Fill in with wrong PIN
    await page.getByLabel(/your name/i).fill(users.kid1.id);
    await page.getByLabel(/pin code/i).fill('9999');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error (API returns "Invalid PIN or user ID")
    await expect(page.getByText(/invalid pin or user id/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('sign out works correctly', async ({ page, browserName }) => {
    const users = getTestUsers(browserName);

    // Log in
    await page.getByLabel('Email').fill(users.parent.email);
    await page.getByLabel('Password').fill(users.parent.password);

    // Submit form and wait for navigation
    // WebKit needs both URL change and load state wait
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Sign out and wait for navigation
    await Promise.all([
      page.waitForURL('/login', { timeout: 10000 }),
      page.getByRole('button', { name: /sign out/i }).click(),
    ]);

    // Should be on login page
    await expect(page).toHaveURL('/login');

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should be redirected back to login
    await expect(page).toHaveURL(/\/login/);
  });
});
