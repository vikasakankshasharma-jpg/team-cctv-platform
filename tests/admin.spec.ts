import { test, expect } from '@playwright/test';
import { authenticateRole } from './utils/e2eAuth';

test.describe('Intense Admin Flow E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate as an Admin before each test
    await authenticateRole(page, 'admin');
  });

  test('1. Admin can access dashboard and view metrics', async ({ page }) => {
    // Assert we landed on the admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    
    // Check that Firebase client data loaded (wait for a metric card or specific dashboard text)
    // "Dashboard|Overview|Analytics" are typical headers. Let's wait for a sign that Firebase hasn't thrown permission-denied.
    await expect(page.locator('text=Command Centre').first()).toBeVisible();
    await expect(page.locator('text=Total Pipeline')).toBeVisible({ timeout: 15000 });
  });

  test('2. Admin can navigate to Leads and verify lead data', async ({ page }) => {
    await page.goto('/admin/leads');
    await expect(page).toHaveURL(/\/admin\/leads/);
    // Wait for leads to populate in either Table view or Kanban view
    const tableHeader = page.locator('th', { hasText: 'Customer' }).first();
    const emptyState = page.locator('text=No Leads Found').first();
    const kanbanHeader = page.locator('h3', { hasText: 'Contacted' }).first();
    
    await Promise.any([
      expect(tableHeader).toBeVisible({ timeout: 15000 }),
      expect(emptyState).toBeVisible({ timeout: 15000 }),
      expect(kanbanHeader).toBeVisible({ timeout: 15000 })
    ]);
  });

  test('3. Admin can access Products/Catalog without Permission errors', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/admin\/products/);
    
    // Ensure the catalog renders and no infinite spinners remain
    await expect(page.locator('text=Hardware Management').first()).toBeVisible({ timeout: 15000 });
  });

  test('4. Admin can access global Settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings/);
    
    // Global Configuration section should be visible
    await expect(page.locator('text=Global Configuration').first()).toBeVisible({ timeout: 15000 });
  });

});
