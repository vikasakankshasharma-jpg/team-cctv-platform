import { test, expect } from '@playwright/test';

test.describe('New Features E2E Verification', () => {

  test('Customer Quotation: Price Match On-Card CTA, Anchored Banner & Form', async ({ page }) => {
    // Set localStorage so LanguageWelcomeModal doesn't show
    await page.addInitScript(() => {
      window.localStorage.setItem('i18n-storage', JSON.stringify({
        state: { locale: 'en', isManuallySet: true, hasSeenWelcome: true },
        version: 0
      }));
    });

    // Navigate to quotation page for mock lead
    await page.goto('/quote/mock-e2e-lead');

    // Dismiss Language modal if it appears
    const langClose = page.locator('button[aria-label="Close"]');
    if (await langClose.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langClose.click().catch(() => {});
    }

    // Wait for the quotation builder to load
    await expect(page.getByRole('heading', { name: /Build Your Quotation/i })).toBeVisible({ timeout: 20000 });

    // Verify the on-card "Lower competitor quote? Match Price" button exists on quotation cards
    const cardMatchBtn = page.getByRole('button', { name: /Lower competitor quote\? Match Price/i }).first();
    await expect(cardMatchBtn).toBeVisible({ timeout: 15000 });

    // Click the on-card Price Match button
    await cardMatchBtn.click();

    // Verify the uploader appears pre-anchored to the package
    await expect(page.getByText(/Price Match Guarantee/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/You are comparing:/i)).toBeVisible();

    // Verify the form fields
    const competitorInput = page.getByPlaceholder(/CP Plus Dealer, Local CCTV Shop/i);
    await expect(competitorInput).toBeVisible();

    const uploadZone = page.getByText(/Drop your quote here or click to browse/i);
    await expect(uploadZone).toBeVisible();

    // Strict constraint check: ensure "2 years onsite warranty" is NEVER rendered
    await expect(page.getByText(/2 years onsite warranty/i)).not.toBeVisible();
  });

});
