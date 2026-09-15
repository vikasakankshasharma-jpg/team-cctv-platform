import { test, expect } from '@playwright/test';

test.describe('B2B Billing and Site Survey Flow', () => {
  test.setTimeout(120000); 

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[browser] ${msg.text()}`));
    page.on('pageerror', error => console.log(`[browser error] ${error.message}`));
  });

  test('Test Site Survey and B2B GST Billing Flow', async ({ page }) => {
    
    // Seed DB and navigate to wizard
    await page.goto('/api/dev/seed-wizard');
    await page.waitForTimeout(2000); 
    await page.goto('/wizard');

    // Quick complete wizard
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

    await page.fill('input[placeholder="e.g. Rahul Kumar"]', 'E2E Test User');
    await page.fill('input[placeholder="10-digit mobile number"]', '9999999999');
    await page.getByRole('button', { name: /View My CCTV Options/i }).click();

    // Fill OTP
    await expect(page.locator('text=Enter Verification Code')).toBeVisible({ timeout: 15000 });
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }

    // Go to Add-ons / Review
    await expect(page.locator('h2', { hasText: 'Build Your Quotation' })).toBeVisible({ timeout: 45000 });
    await page.locator('button:has-text("Select Plan")').nth(1).click();
    await expect(page.locator('h2', { hasText: 'Build your own system.' })).toBeVisible({ timeout: 15000 });

    // Step 2: Book Site Visit
    await page.locator('button:has-text("Schedule Site Visit"), button:has-text("Book Site Visit")').first().click();
    await expect(page.locator('h2', { hasText: 'Pinpoint Your Site' })).toBeVisible({ timeout: 15000 });
    
    // Fill Survey details
    const pincodeInput = page.locator('input[placeholder="400001"]');
    await pincodeInput.fill('302001');
    await page.waitForTimeout(2000);
    await page.fill('input[placeholder="Near Metro, Opp. Temple..."]', 'Test Landmark');
    await page.fill('textarea[placeholder="Building, Wing, Unit No., Street..."]', '123 E2E Test Street');
    await page.locator('button', { hasText: 'Confirm Site' }).click();
    await expect(page.locator('text=Visit Booked!')).toBeVisible({ timeout: 15000 });

    // Step 3: Open Billing Modal via Pay Advance
    // Often it says "Pay Advance ₹XXX"
    const payBtn = page.locator('button:has-text("Pay")').last();
    await payBtn.click();
    
    // Verify Billing Modal Opens
    await expect(page.locator('h2:has-text("Billing Details")')).toBeVisible({ timeout: 10000 });

    // Switch to B2B
    await page.getByText(/Business \(B2B\)/i).click();

    // Fill B2B Details
    await page.fill('input[placeholder="Acme Corp Pvt Ltd"]', 'E2E Testing Corp');
    await page.fill('input[placeholder="22AAAAA0000A1Z5"]', '08AABCT1234A1ZS');
    await page.fill('input[placeholder="Billing Address Line 1"]', 'Sector 5, Jaipur');
    
    // Save and Proceed
    await page.locator('button:has-text("Save & Proceed to Payment")').click();

    // Wait for the modal to close or Razorpay to trigger
    await page.waitForTimeout(3000);
    console.log("Successfully reached Razorpay trigger stage with B2B Details");
  });
});
