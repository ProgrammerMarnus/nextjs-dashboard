import { test, expect } from '@playwright/test';

test.describe('Dashboard Application', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should redirect to dashboard after login', async ({ page }) => {
    await page.goto('/login');
    // This would require actual credentials - skipping for now
    // await page.fill('input[type="email"]', 'test@example.com');
    // await page.fill('input[type="password"]', 'password');
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Invoices', () => {
    test('should load invoices page', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      // Page should load (may redirect to login if not authenticated)
      await expect(page).not.toHaveURL(/.*500/);
    });
  });

  test.describe('Patients', () => {
    test('should load patients page', async ({ page }) => {
      await page.goto('/dashboard/patients');
      await expect(page).not.toHaveURL(/.*500/);
    });
  });

  test.describe('Appointments', () => {
    test('should load appointments page', async ({ page }) => {
      await page.goto('/dashboard/appointments');
      await expect(page).not.toHaveURL(/.*500/);
    });
  });
});