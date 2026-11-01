import { test, expect } from "@playwright/test";

test.describe("EMI & Affordability Experience E2E", () => {
  test("Desktop: should display EMI options on packages and open the EMI Breakdown Modal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Dismiss language welcome modal in local storage
    await page.addInitScript(() => {
      localStorage.setItem("i18n-storage", JSON.stringify({
        state: { locale: "en", hasSeenWelcome: true, isManuallySet: true },
        version: 0
      }));
    });

    // 1. Navigate to the quotation configurator with mock data
    await page.goto("http://localhost:3000/quote/mock-lead?name=Vikas+Sharma&mobile=9876543210");
    await expect(page.locator("h1", { hasText: /Your security/i })).toBeVisible({ timeout: 15000 });

    // 2. Verify EMI teaser is displayed on the available package cards in the catalog
    const emiCardTeaser = page.locator("text=/or from ₹[0-9,]+\\/mo/i").first();
    await expect(emiCardTeaser).toBeVisible({ timeout: 10000 });

    // 3. Click the first package card to open the Instant Quotation Review
    const firstPackageCard = page.locator(".group", { hasText: /Resolution/i }).first();
    await firstPackageCard.click();

    // 4. Verify we are now on Instant Quotation Review (Hero card)
    await expect(page.locator("text=/CONFIRMED QUOTATION/i")).toBeVisible({ timeout: 10000 });

    // 5. Verify in-hero direct booking CTA
    const heroBookingCta = page.locator("button", { hasText: /Book with ₹500 Token Advance/i }).first();
    await expect(heroBookingCta).toBeVisible();

    // 6. Verify EMI sub-header anchor button in the hero price block
    const emiAnchorBtn = page.locator("button", { hasText: /or ₹[0-9,]+\/mo/i }).first();
    await expect(emiAnchorBtn).toBeVisible({ timeout: 10000 });

    // 7. Verify the Affordability & Flexibility Twin-Trust strip
    const emiTrustCard = page.locator("text=/Easy EMI from ₹[0-9,]+\/mo/i");
    await expect(emiTrustCard).toBeVisible();

    const advanceTrustCard = page.locator("text=/Pay After Installation/i");
    await expect(advanceTrustCard).toBeVisible();

    // 8. Verify 4-Pillar Guarantee strip
    await expect(page.locator("text=/Zero Advance Risk/i")).toBeVisible();
    await expect(page.locator("text=/100% Original Brand/i")).toBeVisible();
    await expect(page.locator("text=/7-Day Price Lock/i")).toBeVisible();

    // 9. Click on "Plans" in the EMI trust card to open the modal
    const viewPlansBtn = page.locator("text=/Easy EMI/i").first();
    await viewPlansBtn.click();

    // 10. Verify the EMI Breakdown Modal opens
    await expect(page.locator("h3", { hasText: /Flexible EMI Options/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("3 Months", { exact: true })).toBeVisible();
    await expect(page.getByText("6 Months", { exact: true })).toBeVisible();
    await expect(page.getByText("12 Months", { exact: true })).toBeVisible();
    await expect(page.locator("text=/Secured by/i")).toBeVisible();

    // 11. Close the modal
    const closeBtn = page.locator("button", { hasText: /Close/i });
    await closeBtn.click();
    await expect(page.locator("h3", { hasText: /Flexible EMI Options/i })).not.toBeVisible();
  });

  test("Mobile (360x740): should be 100% mobile-friendly with clean layout and working bottom sheet", async ({ page }) => {
    // Standard compact mobile viewport
    await page.setViewportSize({ width: 360, height: 740 });

    await page.addInitScript(() => {
      localStorage.setItem("i18n-storage", JSON.stringify({
        state: { locale: "en", hasSeenWelcome: true, isManuallySet: true },
        version: 0
      }));
    });

    await page.goto("http://localhost:3000/quote/mock-lead?name=Vikas+Sharma&mobile=9876543210");
    await expect(page.locator("h1", { hasText: /Your security/i })).toBeVisible({ timeout: 15000 });

    // Click package card to open review
    const firstPackageCard = page.locator(".group", { hasText: /Resolution/i }).first();
    await firstPackageCard.click();

    // Verify confirmed quotation card is visible
    await expect(page.locator("text=/CONFIRMED QUOTATION/i")).toBeVisible({ timeout: 10000 });

    // Verify in-hero booking button on mobile
    const heroBookingCtaMobile = page.locator("button", { hasText: /Book with ₹500 Token Advance/i }).first();
    await expect(heroBookingCtaMobile).toBeVisible();

    // Verify price & EMI anchor in hero card on mobile
    const emiBtnMobile = page.locator("button", { hasText: /or ₹[0-9,]+\/mo/i }).first();
    await expect(emiBtnMobile).toBeVisible();

    // Verify Twin-Trust cards are stacked and visible
    await expect(page.locator("text=/Easy EMI/i").first()).toBeVisible();
    await expect(page.locator("text=/Pay After Installation/i")).toBeVisible();

    // Verify Sticky SmartContextBar bottom bar has EMI link
    const contextBarEmi = page.locator("text=/or ₹[0-9,]+\\/mo \\(EMI\\)/i").last();
    await expect(contextBarEmi).toBeVisible();

    // Tap in-hero EMI button to open mobile bottom sheet
    await emiBtnMobile.click();

    // Modal should be visible as mobile bottom sheet
    await expect(page.locator("h3", { hasText: /Flexible EMI Options/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("3 Months", { exact: true })).toBeVisible();

    // Check tenure switching
    await page.getByText("12 Months", { exact: true }).click();
    await expect(page.getByText("Total: ₹", { exact: false }).first()).toBeVisible();

    // Close bottom sheet via Close button
    await page.locator("button", { hasText: /Close/i }).click();
    await expect(page.locator("h3", { hasText: /Flexible EMI Options/i })).not.toBeVisible();
  });
});
