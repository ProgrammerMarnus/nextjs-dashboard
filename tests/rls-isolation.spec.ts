import { test, expect } from '@playwright/test';

test.describe('Two-user RLS isolation', () => {
  test('user one creates patient and appointment, user two sees only their own', async ({ browser }) => {
    // User One context
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // User Two context (private window)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    try {
      // --- USER ONE LOGIN ---
      await page1.goto('http://localhost:3000/login');
      await page1.fill('input[name="email"]', 'user@nextmail.com');
      await page1.fill('input[name="password"]', '123456');
      await page1.click('button:has-text("Log in")');
      await expect(page1).toHaveURL(/\/dashboard/);
      
      // Create a patient for user one
      await page1.goto('http://localhost:3000/dashboard/patients/create');
      await page1.fill('input[name="full_name"]', 'John Doe');
      await page1.fill('input[name="phone"]', '555-1234');
      await page1.fill('input[name="date_of_birth"]', '1990-01-01');
      await page1.click('button:has-text("Add patient")');
      await expect(page1).toHaveURL(/\/dashboard\/patients/);
      
      // Create appointment for user one
      await page1.goto('http://localhost:3000/dashboard/appointments/create');
      await page1.selectOption('select[name="patient_id"]', { label: 'John Doe' });
      await page1.fill('input[name="starts_at"]', '2026-10-10T10:00');
      await page1.selectOption('select[name="status"]', 'booked');
      await page1.click('button:has-text("Create appointment")');
      await expect(page1).toHaveURL(/\/dashboard\/appointments/);
      
      // Verify appointment appears for user one
      await expect(page1.locator('table')).toContainText('John Doe');
      // formatSA produces "10 Oct 2026, 10:00" (en-ZA locale)
      await expect(page1.locator('table')).toContainText('Oct 2026');
      console.log('✓ User One: Appointment created and visible');

      // --- USER TWO LOGIN ---
      await page2.goto('http://localhost:3000/login');
      await page2.fill('input[name="email"]', 'user2@nextmail.com');
      await page2.fill('input[name="password"]', '123456');
      await page2.click('button:has-text("Log in")');
      await expect(page2).toHaveURL(/\/dashboard/);
      
      // User two should NOT see user one's appointments (RLS isolation)
      await page2.goto('http://localhost:3000/dashboard/appointments');
      await expect(page2.locator('table')).not.toContainText('John Doe');
      console.log('✓ User Two: Does not see User One appointments (RLS working)');
      
      // User two creates their own patient
      await page2.goto('http://localhost:3000/dashboard/patients/create');
      await page2.fill('input[name="full_name"]', 'Jane Smith');
      await page2.fill('input[name="phone"]', '555-5678');
      await page2.fill('input[name="date_of_birth"]', '1995-05-05');
      await page2.click('button:has-text("Add patient")');
      await expect(page2).toHaveURL(/\/dashboard\/patients/);
      
      // User two creates appointment - should only see their own patient in select
      await page2.goto('http://localhost:3000/dashboard/appointments/create');
      const patientOptions = await page2.locator('select[name="patient_id"] option').allTextContents();
      console.log('User Two patient options:', patientOptions);
      expect(patientOptions).toContain('Jane Smith');
      expect(patientOptions).not.toContain('John Doe');
      console.log('✓ User Two: Patient select only shows their own patients');
      
      await page2.selectOption('select[name="patient_id"]', { label: 'Jane Smith' });
      await page2.fill('input[name="starts_at"]', '2026-10-11T14:30');
      await page2.selectOption('select[name="status"]', 'booked');
      await page2.click('button:has-text("Create appointment")');
      await expect(page2).toHaveURL(/\/dashboard\/appointments/);
      
      // Verify user two sees their appointment
      await expect(page2.locator('table')).toContainText('Jane Smith');
      await expect(page2.locator('table')).toContainText('Oct 2026');
      console.log('✓ User Two: Appointment created and visible');

      // --- VERIFY ISOLATION ---
      // User one should still only see their appointment
      await page1.goto('http://localhost:3000/dashboard/appointments');
      await expect(page1.locator('table')).toContainText('John Doe');
      await expect(page1.locator('table')).not.toContainText('Jane Smith');
      console.log('✓ User One: Still only sees their own appointment');

      console.log('\n✅ TWO-USER RLS ISOLATION TEST PASSED');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});