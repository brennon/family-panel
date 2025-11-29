import { test, expect } from '@playwright/test';

/**
 * Authentication E2E tests
 * Tests the complete authentication flows for parents and kids
 *
 * PREREQUISITES:
 * 1. Wipe database completely
 * 2. Run all migrations in order:
 *    - 001_initial_schema.sql
 *    - 002_add_role_to_users.sql
 *    - 003_add_kid_pin.sql
 *    - 004_add_family_relationships.sql
 *    - 005_seed_test_data.sql (creates test users with deterministic UUIDs)
 * 3. Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY set
 *
 * Test users created by seed data:
 * - parent@example.com (password: parentpassword123, ID: 00000000-0000-0000-0000-000000000001)
 * - kid1@example.com (Alice Kid, PIN: 1234, ID: 00000000-0000-0000-0000-000000000002)
 * - kid2@example.com (Bob Kid, PIN: 5678, ID: 00000000-0000-0000-0000-000000000003)
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('parent can log in with email and password', async ({ page }) => {
    // Fill in parent login form
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByLabel('Password').fill('parentpassword123');

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Should show parent's name
    await expect(page.getByText(/john parent/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('kid can log in with PIN', async ({ page }) => {
    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Wait for kid form to be visible
    await expect(page.getByLabel(/your name/i)).toBeVisible();

    // Fill in kid login form
    await page.getByLabel(/your name/i).fill('00000000-0000-0000-0000-000000000002');
    await page.getByLabel(/pin code/i).fill('1234');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard (dashboard can take 10-30s to load in dev mode)
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 });

    // Should show kid's name (use first() to handle multiple matches)
    await expect(page.getByText(/alice kid/i).first()).toBeVisible();
  });

  test('session persists after page refresh', async ({ page }) => {
    // Log in as parent
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByLabel('Password').fill('parentpassword123');

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Wait for user data to load
    await expect(page.getByText(/john parent/i).first()).toBeVisible({ timeout: 10000 });

    // Refresh page
    await page.reload();

    // Wait for page to finish loading (don't use networkidle - Supabase keeps connections open)
    await page.waitForLoadState('domcontentloaded');

    // Check we're still on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard');

    // User name should eventually appear (may take a moment for profile to load)
    await expect(page.getByText(/john parent/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('invalid PIN shows error', async ({ page }) => {
    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Wait for kid form to be visible
    await expect(page.getByLabel(/your name/i)).toBeVisible();

    // Fill in with wrong PIN
    await page.getByLabel(/your name/i).fill('00000000-0000-0000-0000-000000000002');
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

  test('sign out works correctly', async ({ page }) => {
    // Log in
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByLabel('Password').fill('parentpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 30000 });

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should be redirected back to login
    await expect(page).toHaveURL(/\/login/);
  });
});
