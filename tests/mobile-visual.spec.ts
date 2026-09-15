import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Visual Test', () => {
  test.setTimeout(120000); 

  test('Capture mobile screenshots for Site Survey & Billing', async ({ page }) => {
    
    await page.goto('/api/dev/seed-wizard').catch(() => {});
    await page.goto('/wizard');

    await page.getByRole('button', { name: /Guided Setup/i }).click();
    await page.getByText(/Completely New System/i, { exact: false }).click();
    await page.getByRole('button', { name: '+' }).first().click();
    await page.getByRole('button', { name: /Confirm Cameras/i }).click();
    await page.getByText('15 Days', { exact: true }).click();
    await page.getByText('24x7 Continuous', { exact: true }).click();
    await page.getByRole('button', { name: /Confirm Recording/i }).click();
    await page.getByText('Standard (<10ft)').click();
    await page.getByText('Concrete / Brick Wall').click();
    await page.getByText('Concealed / Conduit').click();
    await page.getByRole('button', { name: /Confirm Details/i }).click();

    await page.fill('input[placeholder="e.g. Rahul Kumar"]', 'E2E Mobile Tester');
    await page.fill('input[placeholder="10-digit mobile number"]', '9999999999');
    await page.getByRole('button', { name: /View My CCTV Options/i }).click();

    await expect(page.locator('text=Enter Verification Code')).toBeVisible({ timeout: 15000 });
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }

    await expect(page.locator('h2', { hasText: 'Build Your Quotation' })).toBeVisible({ timeout: 45000 });
    await page.locator('button:has-text("Select Plan")').nth(1).click();
    await expect(page.locator('h2', { hasText: 'Build your own system.' })).toBeVisible({ timeout: 15000 });

    // 1. Mobile Review Page
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/1be78992-3ad5-4b7e-a2e5-9353d047dbdf/mobile_review_page.jpg', fullPage: true });

    // 2. Site Survey Modal
    await page.locator('button:has-text("Schedule Site Visit"), button:has-text("Book Site Visit")').first().click();
    await expect(page.locator('h2', { hasText: 'Pinpoint Your Site' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/1be78992-3ad5-4b7e-a2e5-9353d047dbdf/mobile_site_survey_modal.jpg' });
    
    // Close survey modal
    await page.locator('button').filter({ hasText: '✕' }).click().catch(() => page.keyboard.press('Escape'));
    await page.waitForTimeout(1000);

    // 3. Billing Modal
    const payBtn = page.locator('button:has-text("Pay")').last();
    await payBtn.click();
    await expect(page.locator('h2:has-text("Billing Details")')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/1be78992-3ad5-4b7e-a2e5-9353d047dbdf/mobile_billing_modal.jpg' });

    console.log("Mobile screenshots captured successfully.");
  });
});
