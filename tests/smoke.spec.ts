import { test, expect } from '@playwright/test';

test.describe('CCTV Wizard Smoke Test', () => {
  test('should load the homepage and start the wizard', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    
    // 2. Check for the main CTA
    const startButton = page.getByRole('link', { name: /start|get cctv quotation/i }).first();
    await expect(startButton).toBeVisible();
    
    // 3. Click and navigate to wizard
    await startButton.click();
    await expect(page).toHaveURL(/.*wizard/);
    
    // 4. Check if the first question loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // 5. Verify progress indicator exists
    await expect(page.getByText(/Your Quote Progress/i)).toBeVisible();
    await expect(page.getByText(/\d+%/)).toBeVisible();
  });

  test('admin login page should be accessible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
