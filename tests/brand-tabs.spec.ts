import { test, expect } from '@playwright/test';
import path from 'path';

test('Brand filter switching test', async ({ page }) => {
  await page.goto('http://localhost:3000/quote/mock-e2e-lead');
  await page.waitForTimeout(2000);

  // 1. Check default: All Brands
  await expect(page.getByRole('button', { name: 'All Brands' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CP Plus' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hikvision' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dahua' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Budget' })).toBeVisible();

  // 2. Click CP Plus
  await page.getByRole('button', { name: 'CP Plus' }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator('text=CP Plus').first()).toBeVisible();

  // 3. Click Hikvision
  await page.getByRole('button', { name: 'Hikvision' }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Hikvision').first()).toBeVisible();

  // 4. Click Dahua
  await page.getByRole('button', { name: 'Dahua' }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Dahua').first()).toBeVisible();

  // 5. Click IP Technology
  await page.getByRole('button', { name: 'Premium IP (Network)' }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole('button', { name: 'All Brands' })).toBeVisible();
});
