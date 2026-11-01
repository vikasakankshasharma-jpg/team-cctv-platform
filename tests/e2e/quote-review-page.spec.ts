import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Quote Review Page Optimization E2E", () => {
  test("Desktop: Should render in-hero EMI & booking CTA, twin-trust cards, itemized BOM table, and open EMI modal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.addInitScript(() => {
      localStorage.setItem("i18n-storage", JSON.stringify({
        state: { locale: "en", hasSeenWelcome: true, isManuallySet: true },
        version: 0
      }));
    });

    await page.goto("http://localhost:3000/quote/mock-lead/review/mock-quote");
    await expect(page.locator("text=/OFFICIAL QUOTATION/i")).toBeVisible({ timeout: 20000 });

    // 1. In-Hero Direct Booking CTA
    const heroBookingCta = page.locator("button:has-text('Book with ₹500 Token Advance')").first();
    await expect(heroBookingCta).toBeVisible();

    // 2. In-Hero Golden EMI Pill
    const heroEmiBtn = page.locator("button:has-text('Plans ⓘ')").first();
    await expect(heroEmiBtn).toBeVisible();

    // 3. Affordability & Flexibility Twin-Trust Cards
    await expect(page.locator("text=/Easy EMI from ₹/i")).toBeVisible();
    await expect(page.locator("text=/Pay After Installation \\(Zero Risk\\)/i")).toBeVisible();

    // 4. Desktop Itemized Table
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("th:has-text('Item & Description')")).toBeVisible();

    // 5. 4-Pillar Peace-of-Mind Guarantee
    await expect(page.locator("text=Zero Advance Risk")).toBeVisible();
    await expect(page.locator("text=100% Original Brand")).toBeVisible();
    await expect(page.locator("text=Certified Engineers")).toBeVisible();
    await expect(page.locator("h5:has-text('14-Day Price Lock')")).toBeVisible();

    // 6. Click EMI button and verify modal opens
    await heroEmiBtn.click();
    await expect(page.locator("text=Flexible EMI Options")).toBeVisible();
    await expect(page.getByText("3 Months", { exact: true })).toBeVisible();
    await expect(page.getByText("12 Months", { exact: true })).toBeVisible();

    // Take screenshot of desktop with modal open
    await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity/brain/364e2189-1f4a-4ff7-95f4-8a3bfbcba3a9/optimized-review-desktop-modal.png", fullPage: false });

    // Close modal
    await page.locator("button:has-text('Close')").click();
    await expect(page.locator("text=Flexible EMI Options")).not.toBeVisible();

    // Take screenshot of desktop page
    await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity/brain/364e2189-1f4a-4ff7-95f4-8a3bfbcba3a9/optimized-review-desktop.png", fullPage: false });
  });

  test("Mobile (375x812): Should be 100% responsive, render compact cards, and sticky bottom bar with EMI plans", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.addInitScript(() => {
      localStorage.setItem("i18n-storage", JSON.stringify({
        state: { locale: "en", hasSeenWelcome: true, isManuallySet: true },
        version: 0
      }));
    });

    await page.goto("http://localhost:3000/quote/mock-lead/review/mock-quote");
    await expect(page.locator("text=/OFFICIAL QUOTATION/i")).toBeVisible({ timeout: 20000 });

    // 1. Verify in-hero elements on mobile
    await expect(page.locator("button:has-text('Book with ₹500 Token Advance')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Plans ⓘ')").first()).toBeVisible();

    // 2. Verify mobile card layout
    await expect(page.locator(".sm\\:hidden.space-y-2\\.5")).toBeVisible();

    // 3. Verify sticky bottom bar
    const stickyBar = page.locator(".fixed.bottom-0");
    await expect(stickyBar).toBeVisible();
    await expect(stickyBar.locator("button:has-text('Book ₹500')")).toBeVisible();
    const stickyEmiBtn = stickyBar.locator("button:has-text('EMI Plans')");
    await expect(stickyEmiBtn).toBeVisible();

    // Take screenshot of mobile
    await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity/brain/364e2189-1f4a-4ff7-95f4-8a3bfbcba3a9/optimized-review-mobile.png", fullPage: false });

    // 4. Click EMI button in bottom bar
    await stickyEmiBtn.click();
    await expect(page.locator("text=Flexible EMI Options")).toBeVisible();

    // Take screenshot of mobile modal
    await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity/brain/364e2189-1f4a-4ff7-95f4-8a3bfbcba3a9/optimized-review-mobile-modal.png", fullPage: false });
  });
});
