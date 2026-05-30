import { test, expect } from '@playwright/test';
import { authenticateRole } from './utils/e2eAuth';

test.describe('Intense Salesperson Flow E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate as a Salesperson before each test
    await authenticateRole(page, 'salesperson');
  });

  test('1. Salesperson can access their specific dashboard without Firebase errors', async ({ page }) => {
    await expect(page).toHaveURL(/\/salesperson\/dashboard/);
    
    // We expect the dashboard to load some sales data
    await expect(page.locator('text=Command Centre').first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Salesperson can view their assigned leads', async ({ page }) => {
    await page.goto('/salesperson/leads');
    await expect(page).toHaveURL(/\/salesperson\/leads/);
    
    // Wait for the leads table or empty state
    await expect(page.locator('text=My Leads').first()).toBeVisible({ timeout: 15000 });
    
    // Test that the view doesn't throw permission denied by waiting for the table
    const tableHeader = page.locator('th', { hasText: 'Status' }).first();
    const emptyState = page.locator('text=No leads assigned').first();
    
    await Promise.any([
      expect(tableHeader).toBeVisible({ timeout: 15000 }),
      expect(emptyState).toBeVisible({ timeout: 15000 })
    ]);
  });

});
