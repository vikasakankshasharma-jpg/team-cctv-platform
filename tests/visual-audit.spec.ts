import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-results', 'visual-audit-screenshots');

test.describe('Visual Audit – Full Customer Journey', () => {
  test.setTimeout(120000);

  test('Capture every screen in the flow', async ({ page }) => {
    // Ensure screenshots directory exists
    const fs = await import('fs');
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // ─── SCREEN 1: Landing / Home Page ───────────────────────────
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-home-page.png'), fullPage: true });

    // ─── SCREEN 2: Wizard – Step 0 (Guided Setup) ───────────────
    await page.goto('/wizard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-wizard-start.png'), fullPage: true });

    await page.getByRole('button', { name: /Guided Setup/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-wizard-installation-type.png'), fullPage: true });

    // ─── SCREEN 3: Wizard – New Installation ─────────────────────
    await page.getByText(/Completely New System/i, { exact: false }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-wizard-camera-count.png'), fullPage: true });

    // ─── SCREEN 4: Camera Count ──────────────────────────────────
    await page.getByRole('button', { name: '+' }).first().click(); // outdoor
    await page.getByRole('button', { name: '+' }).nth(1).click(); // indoor
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-wizard-camera-count-filled.png'), fullPage: true });

    await page.getByRole('button', { name: /Confirm Cameras/i }).click();
    await page.waitForTimeout(1000);

    // ─── SCREEN 5: Recording / Storage ───────────────────────────
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-wizard-storage.png'), fullPage: true });

    await page.getByText('15 Days', { exact: true }).click();
    await page.getByText('24x7 Continuous', { exact: true }).click();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-wizard-storage-filled.png'), fullPage: true });

    await page.getByRole('button', { name: /Confirm Recording/i }).click();
    await page.waitForTimeout(1000);

    // ─── SCREEN 6: Site Overview ─────────────────────────────────
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-wizard-site-overview.png'), fullPage: true });

    await page.getByText('Standard (<10ft)').click();
    await page.getByText('Concrete / Brick Wall').click();
    await page.getByText('Concealed / Conduit').click();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-wizard-site-filled.png'), fullPage: true });

    await page.getByRole('button', { name: /Confirm Details/i }).click();
    await page.waitForTimeout(1000);

    // ─── SCREEN 7: Contact Info ──────────────────────────────────
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-wizard-contact.png'), fullPage: true });

    await page.fill('input[placeholder="e.g. Rahul Kumar"]', 'E2E Test User');
    await page.fill('input[placeholder="10-digit mobile number"]', '9999999999');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-wizard-contact-filled.png'), fullPage: true });

    await page.getByRole('button', { name: /View My CCTV Options/i }).click();
    await page.waitForTimeout(2000);

    // ─── SCREEN 8: OTP Verification ──────────────────────────────
    await expect(page.locator('text=Enter Verification Code')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-wizard-otp.png'), fullPage: true });

    // Fill OTP
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-wizard-otp-filled.png'), fullPage: true });

    // ─── SCREEN 9: Quotation Catalog Grid ────────────────────────
    await expect(page.locator('h2', { hasText: 'Build Your Quotation' })).toBeVisible({ timeout: 45000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-catalog-grid.png'), fullPage: true });

    // Scroll down to see the cards
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-catalog-cards.png'), fullPage: true });

    // ─── SCREEN 10: Select a Plan → Customizer (Add-ons) ────────
    await page.locator('button:has-text("Select Plan")').nth(1).click();
    await expect(page.locator('h2', { hasText: 'Build your own system.' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-customizer-addons.png'), fullPage: true });

    // Try clicking Accessories tab if visible
    const accessoriesTab = page.locator('button', { hasText: 'Accessories' }).first();
    if (await accessoriesTab.isVisible()) {
      await accessoriesTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-customizer-accessories-tab.png'), fullPage: true });
    }

    // Try adding an add-on
    const addBtn = page.locator('button', { hasText: /^Add$/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18-customizer-addon-added.png'), fullPage: true });
    }

    // ─── SCREEN 11: Smart Context Bar (Bottom bar) ───────────────
    const contextBar = page.locator('.fixed.bottom-0');
    if (await contextBar.isVisible()) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19-smart-context-bar.png'), fullPage: false });
    }

    // ─── SCREEN 12: Book Site Visit → Site Details Modal ─────────
    await page.locator('button:has-text("Schedule Site Visit"), button:has-text("Book Site Visit")').first().click();
    await expect(page.locator('h2', { hasText: 'Pinpoint Your Site' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '20-site-details-modal.png'), fullPage: false });

    // Fill site details
    const pincodeInput = page.locator('input[placeholder="400001"]');
    await pincodeInput.fill('302001');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '21-site-pincode-filled.png'), fullPage: false });

    await page.fill('input[placeholder="Near Metro, Opp. Temple..."]', 'Near Test Landmark');
    await page.fill('textarea[placeholder="Building, Wing, Unit No., Street..."]', '123 E2E Test Street, Visual Audit City');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '22-site-address-filled.png'), fullPage: false });

    // ─── SCREEN 13: Confirm Site → Final Booking ─────────────────
    await page.locator('button', { hasText: 'Confirm Site' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '23-booking-confirmed.png'), fullPage: true });
  });
});
