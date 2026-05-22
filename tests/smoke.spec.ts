import { test, expect } from '@playwright/test';

test.describe('CCTV Wizard Smoke Test', () => {
  test('should load the homepage and start the wizard', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    
    // 2. Check for the main CTA (Check Area)
    const startButton = page.getByRole('button', { name: /check area/i }).first();
    await expect(startButton).toBeVisible();
    
    // 3. Click and navigate to wizard (Note: PincodeWidget requires entering a 6-digit pin first)
    await page.getByPlaceholder(/enter pincode/i).first().fill('302017');
    await startButton.click({ force: true });
    // Wait for the city page or wizard redirect
    await expect(page).toHaveURL(/.*(wizard|302017)/);
    
    // 4. Check if the first question loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // 5. Verify progress indicator exists
    await expect(page.getByText(/Your Progress/i)).toBeVisible();
    await expect(page.getByText(/\d+%/)).toBeVisible();
  });

  test('admin login page should be accessible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByText(/Staff Access Portal/i)).toBeVisible();
    await expect(page.getByPlaceholder('admin@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Auth Code/i })).toBeVisible();
  });
});
