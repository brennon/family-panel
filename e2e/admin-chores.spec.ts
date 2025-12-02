import { test, expect } from '@playwright/test';
import { getTestUsers } from './fixtures/test-users';

/**
 * Admin Chore Management E2E tests
 * Tests the parent admin UI for creating, editing, and deleting chores
 *
 * PREREQUISITES:
 * Same as auth.spec.ts - requires test database with migrations applied
 */
test.describe('Admin Chore Management', () => {
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

  test('parent can navigate to chore management page', async ({ page }) => {
    // Click "Manage Chores" button from dashboard
    await page.getByRole('button', { name: /manage chores/i }).click();

    // Should navigate to chores list
    await expect(page).toHaveURL('/admin/chores');

    // Should see chores page header
    await expect(page.getByRole('heading', { name: /chores/i })).toBeVisible();
  });

  test('parent can view list of chores', async ({ page }) => {
    await page.goto('/admin/chores');

    // Should see page title
    await expect(page.getByRole('heading', { name: /chores/i })).toBeVisible();

    // Should see "Create Chore" button
    await expect(page.getByRole('button', { name: /create chore/i })).toBeVisible();

    // Should have a table or list of chores (may be empty initially)
    // Looking for table headers
    const hasTable = await page.locator('table').count() > 0;
    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    }
  });

  test('parent can create a new chore', async ({ page }) => {
    await page.goto('/admin/chores');

    // Click "Create Chore" button
    await page.getByRole('button', { name: /create chore/i }).click();

    // Should navigate to new chore form
    await expect(page).toHaveURL('/admin/chores/new');
    await expect(page.getByRole('heading', { name: /new chore/i })).toBeVisible();

    // Fill in chore form
    await page.getByLabel(/name/i).fill('Wash Dishes');
    await page.getByLabel(/description/i).fill('Wash all dishes in the sink');
    await page.getByLabel(/value|amount|\$/i).fill('2.50');

    // Submit form
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should redirect back to chores list
    await expect(page).toHaveURL('/admin/chores');

    // Should see the new chore in the list
    await expect(page.getByText('Wash Dishes')).toBeVisible();
  });

  test('form validation works for chore creation', async ({ page }) => {
    await page.goto('/admin/chores/new');

    // Try to submit empty form
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should show validation error
    await expect(page.getByText(/required|must|cannot be empty/i)).toBeVisible();

    // Should stay on form page
    await expect(page).toHaveURL('/admin/chores/new');
  });

  test('parent can edit an existing chore', async ({ page }) => {
    // First, create a chore to edit
    await page.goto('/admin/chores/new');
    await page.getByLabel(/name/i).fill('Take Out Trash');
    await page.getByLabel(/description/i).fill('Take trash to curb');
    await page.getByLabel(/value|amount|\$/i).fill('1.00');
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for redirect to list
    await page.waitForURL('/admin/chores');

    // Find and click edit button for the chore
    const choreRow = page.locator('tr', { hasText: 'Take Out Trash' });
    await choreRow.getByRole('button', { name: /edit/i }).click();

    // Should navigate to edit page
    await expect(page.url()).toContain('/admin/chores/');
    await expect(page.url()).toContain('/edit');
    await expect(page.getByRole('heading', { name: /edit chore/i })).toBeVisible();

    // Form should be pre-filled
    await expect(page.getByLabel(/name/i)).toHaveValue('Take Out Trash');

    // Update the chore
    await page.getByLabel(/name/i).fill('Take Out Trash and Recycling');
    await page.getByLabel(/value|amount|\$/i).fill('1.50');

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click();

    // Should redirect back to list
    await expect(page).toHaveURL('/admin/chores');

    // Should see updated chore
    await expect(page.getByText('Take Out Trash and Recycling')).toBeVisible();
  });

  test('parent can delete a chore', async ({ page }) => {
    // First, create a chore to delete
    await page.goto('/admin/chores/new');
    await page.getByLabel(/name/i).fill('Clean Bathroom');
    await page.getByLabel(/description/i).fill('Clean sink and toilet');
    await page.getByLabel(/value|amount|\$/i).fill('3.00');
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for redirect to list
    await page.waitForURL('/admin/chores');

    // Find and click delete button
    const choreRow = page.locator('tr', { hasText: 'Clean Bathroom' });
    await choreRow.getByRole('button', { name: /delete/i }).click();

    // Should show confirmation dialog
    await expect(page.getByText(/are you sure|confirm delete/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    // Should remove chore from list
    await expect(page.getByText('Clean Bathroom')).not.toBeVisible();
  });

  test('parent can cancel chore deletion', async ({ page }) => {
    // First, create a chore
    await page.goto('/admin/chores/new');
    await page.getByLabel(/name/i).fill('Vacuum Living Room');
    await page.getByLabel(/description/i).fill('Vacuum all carpets');
    await page.getByLabel(/value|amount|\$/i).fill('2.00');
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for redirect to list
    await page.waitForURL('/admin/chores');

    // Click delete button
    const choreRow = page.locator('tr', { hasText: 'Vacuum Living Room' });
    await choreRow.getByRole('button', { name: /delete/i }).click();

    // Should show confirmation dialog
    await expect(page.getByText(/are you sure|confirm delete/i)).toBeVisible();

    // Cancel deletion
    await page.getByRole('button', { name: /cancel|no/i }).click();

    // Chore should still be visible
    await expect(page.getByText('Vacuum Living Room')).toBeVisible();
  });

  test('kids cannot access chore management pages', async ({ page, context, browserName }) => {
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

    // Try to access chore management page directly
    await page.goto('/admin/chores');

    // Should be redirected or see access denied
    // Either redirected to dashboard or see error message
    const url = page.url();
    const hasError = await page.getByText(/access denied|not authorized|permission/i).isVisible().catch(() => false);

    expect(url === '/dashboard' || hasError).toBe(true);
  });
});
