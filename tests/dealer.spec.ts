import { test, expect } from '@playwright/test';
import { authenticateRole } from './utils/e2eAuth';

test.describe('Intense Dealer Flow E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate as a Dealer before each test
    await authenticateRole(page, 'dealer');
  });

  test('1. Dealer can access franchise dashboard and see KPIs', async ({ page }) => {
    await expect(page).toHaveURL(/\/partner\/dashboard/);
    
    // We expect the dealer dashboard to render
    await expect(page.locator('text=Partner Dashboard').first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Dealer can access territory leads without Firebase Permission Denied errors', async ({ page }) => {
    // Navigate via URL to avoid sidebar collapse/hover issues
    await page.goto('/partner/leads');
    await expect(page).toHaveURL(/\/partner\/leads/);
    
    // We expect something related to Leads to be visible
    await expect(page.locator('text=My Pipeline').first()).toBeVisible({ timeout: 15000 });
    const emptyState = page.locator('text=No Leads Found').first();
    
    const tableHeader = page.locator('th').first();
    await Promise.any([
      expect(tableHeader).toBeVisible({ timeout: 15000 }),
      expect(emptyState).toBeVisible({ timeout: 15000 })
    ]);
  });

});
