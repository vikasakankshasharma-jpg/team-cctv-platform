import { test, expect } from '@playwright/test';
import { authenticateRole } from './utils/e2eAuth';

test.describe('New Features E2E Verification', () => {

  test('Customer Wizard: Advanced Mix & Match is available', async ({ page }) => {
    await page.goto('/wizard');
    await page.waitForSelector('h1');
    await page.goto('/quote/mock-e2e-lead');
    await expect(page.getByText('Curated Packages')).toBeVisible();
  });

  test('Admin Portal: CSV Export button exists on Leads page', async ({ page }) => {
    await authenticateRole(page, 'admin');
    await page.goto('/admin/leads');
    await expect(page.getByText('Export CSV')).toBeVisible();
  });

  test('Dealer Portal: Dashboard loads with enhancements', async ({ page }) => {
    await authenticateRole(page, 'dealer');
    await page.goto('/partner/dashboard');
    await expect(page.getByText('Recent Captured Leads')).toBeVisible();
  });

  test('Customer Quotation: Price Match Smart Popup and Inline Link', async ({ page }) => {
    // Navigate to a quotation page
    await page.goto('/quote/mock-e2e-lead');
    await expect(page.getByText('Curated Packages')).toBeVisible({ timeout: 15000 });

    // Verify the inline link exists
    const inlineLink = page.getByText('Upload it for a guaranteed best price');
    await expect(inlineLink).toBeVisible();

    // Click the inline link to show the inline uploader
    await inlineLink.click();

    // Verify the CompetitorQuoteUploader form is visible
    const competitorInput = page.getByPlaceholder('e.g., CP Plus Dealer, Local CCTV Shop');
    await expect(competitorInput).toBeVisible();

    const uploadZone = page.getByText('Drop your quote here or click to browse');
    await expect(uploadZone).toBeVisible();
  });

});
