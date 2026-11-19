import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/hp/.gemini/antigravity/brain/cd809d2e-7aa3-4c47-a67c-787c8f1505d6';

test.describe('Customer Guided Tour Full Journey Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure tour runs fresh
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('Desktop (1280x800): Step 0 covers both Guided Setup and Custom Build with aligned spotlights', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/wizard');

    // Wait for the guided tour dialog to appear
    const tourCard = page.locator('div[role="dialog"]');
    await expect(tourCard).toBeVisible({ timeout: 15000 });

    // Verify Step 1 of 2 (Guided Setup)
    await expect(page.locator('text=Step 1 of 2')).toBeVisible();
    await expect(page.locator('[data-tour="setup-choice"]')).toBeVisible();

    // Settle animation
    await page.waitForTimeout(300);

    // Capture Desktop Step 1 screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'tour-desktop-step0-guided-setup.png'),
      fullPage: false,
    });

    // Advance to Step 2 (Custom Build)
    const nextBtn = tourCard.locator('button:has-text("Next"), button:has-text("कस्टम बिल्ड"), button:has-text("आगे")');
    await nextBtn.click();

    // Verify Step 2 of 2 (Custom Build)
    await expect(page.locator('text=Step 2 of 2')).toBeVisible();
    await expect(page.locator('[data-tour="setup-custom-choice"]')).toBeVisible();

    // Settle transition
    await page.waitForTimeout(300);

    // Capture Desktop Step 2 screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'tour-desktop-step0-custom-build.png'),
      fullPage: false,
    });
  });

  test('Mobile (390x844 - iPhone): Step 0 displays responsive card and highlighted choices with smart inversion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/wizard');

    const tourCard = page.locator('div[role="dialog"]');
    await expect(tourCard).toBeVisible({ timeout: 15000 });

    // Verify Step 1 of 2 on mobile
    await expect(page.locator('text=Step 1 of 2')).toBeVisible();
    await expect(page.locator('[data-tour="setup-choice"]')).toBeVisible();

    await page.waitForTimeout(300);

    // Capture Mobile Step 1 screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'tour-mobile-step0-guided-setup.png'),
      fullPage: false,
    });

    // Tap next to view Custom Build on mobile
    const nextBtn = tourCard.locator('button:has-text("Next"), button:has-text("कस्टम बिल्ड"), button:has-text("आगे")');
    await nextBtn.click();

    await expect(page.locator('text=Step 2 of 2')).toBeVisible();
    await expect(page.locator('[data-tour="setup-custom-choice"]')).toBeVisible();

    await page.waitForTimeout(300);

    // Capture Mobile Step 2 screenshot (Card docks at TOP, Custom Build highlighted at bottom)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'tour-mobile-step0-custom-build.png'),
      fullPage: false,
    });
  });

  test('Full Journey: Tour advances contextually across wizard steps without breaking', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/wizard');

    // Step 0: Finish Step 0 tour and proceed
    const tourCard = page.locator('div[role="dialog"]');
    await expect(tourCard).toBeVisible({ timeout: 15000 });

    // Step through both options
    await tourCard.locator('button:has-text("Next"), button:has-text("कस्टम बिल्ड"), button:has-text("आगे")').click();
    await expect(page.locator('text=Step 2 of 2')).toBeVisible();
    await tourCard.locator('button:has-text("Got It"), button:has-text("हो गया")').click();

    // Now click Guided Setup
    await page.locator('[data-tour="setup-choice"]').click();

    // Step 1: Wiring Architecture
    await expect(page.locator('[data-tour="installation-type"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'tour-desktop-step1-wiring.png'),
      fullPage: false,
    });

    // Dismiss tour for Step 1 and pick Wired
    await page.locator('div[role="dialog"] button:has-text("Next"), div[role="dialog"] button:has-text("आगे")').first().click();
    await page.locator('[data-tour="installation-type"] button').first().click();

    // Step 2: Cameras
    await expect(page.locator('[data-tour="outdoor-cameras"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'tour-desktop-step2-cameras.png'),
      fullPage: false,
    });
  });
});
