import { test, expect } from '@playwright/test';

test.describe('Live Quotation Engine E2E', () => {
  test('should load the quotation page successfully', async ({ page }) => {
    await page.goto('/quote/mock-lead?name=Test+Customer&mobile=9876543210');
    
    // Wait for the UI to load
    await expect(page.getByRole('heading', { name: /Your Security/i })).toBeVisible({ timeout: 10000 });
  });
});
