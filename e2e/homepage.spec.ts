import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display welcome message', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Check that the main heading is visible
    const heading = page.getByRole('heading', { name: 'Welcome to Family Panel' });
    await expect(heading).toBeVisible();

    // Check that the description is visible
    await expect(page.getByText('Family organization and coordination platform')).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await page.goto('/');

    // Check that both buttons are visible and enabled
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    const learnMoreButton = page.getByRole('button', { name: 'Learn More' });

    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();

    await expect(learnMoreButton).toBeVisible();
    await expect(learnMoreButton).toBeEnabled();
  });

  test('should take screenshot of homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for content to be visible
    await page.waitForSelector('h1:has-text("Welcome to Family Panel")');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'e2e/screenshots/homepage.png', fullPage: true });
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');

    // Check page title (from layout.tsx metadata)
    await expect(page).toHaveTitle(/Family Panel/);
  });
});
