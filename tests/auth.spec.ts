import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in login form
    await page.fill('input[name="email"]', 'user@nextmail.com');
    await page.fill('input[name="password"]', '123456');
    
    // Submit form
    await page.click('button:has-text("Log in")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Log in")');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'user@nextmail.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button:has-text("Log in")');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to invoices page', async ({ page }) => {
    await page.click('a[href="/dashboard/invoices"]');
    await expect(page).toHaveURL(/\/dashboard\/invoices/);
  });

  test('should navigate to patients page', async ({ page }) => {
    await page.click('a[href="/dashboard/patients"]');
    await expect(page).toHaveURL(/\/dashboard\/patients/);
  });
});