import { test, expect } from '@playwright/test';

test.describe('Quote & Booking End-to-End Flow', () => {
  // Increase timeout for this full flow since it tests many screens
  test.setTimeout(120000); 

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[browser] ${msg.text()}`));
    page.on('pageerror', error => console.log(`[browser error] ${error.message}`));
  });

  test('Complete Customer Journey: Wizard -> Quote -> Customizer -> Review -> Booking', async ({ page }) => {
    
    // ---------------------------------------------------------
    // STEP 1: The Wizard
    // ---------------------------------------------------------
    await test.step('Seed and Fill out the Customer Wizard', async () => {
      // Ensure the DB has exactly the structure this test expects
      await page.goto('/api/dev/seed-wizard');
      await page.waitForTimeout(2000); // Give the DB a moment
      
      await page.goto('/wizard');

      // Step 0: Guided Setup
      await page.getByRole('button', { name: /Guided Setup/i }).click();

      // Step 1: New Installation
      await page.getByText(/Completely New System/i, { exact: false }).click();

      // Step 2: Camera Count
      await page.getByRole('button', { name: '+' }).first().click(); // outdoor
      await page.getByRole('button', { name: '+' }).nth(1).click(); // indoor
      
      await page.getByRole('button', { name: /Confirm Cameras/i }).click();

      // Step 3: Recording Storage
      await page.getByText('15 Days', { exact: true }).click();
      await page.getByText('24x7 Continuous', { exact: true }).click();
      await page.getByRole('button', { name: /Confirm Recording/i }).click();

      // Step 4: Site overview
      await page.getByText('Standard (<10ft)').click();
      await page.getByText('Concrete / Brick Wall').click();
      await page.getByText('Concealed / Conduit').click();
      await page.getByRole('button', { name: /Confirm Details/i }).click();

      // Step 5: Final Contact Info
      await page.fill('input[placeholder="e.g. Rahul Kumar"]', 'E2E Test User');
      await page.fill('input[placeholder="10-digit mobile number"]', '9999999999');
      await page.getByRole('button', { name: /View My CCTV Options/i }).click();

      // Wait for OTP form to appear inline
      await expect(page.locator('text=Enter Verification Code')).toBeVisible({ timeout: 15000 });
      
      // Fill the 6 OTP input boxes (this will auto-submit when the 6th digit is entered)
      const otpInputs = page.locator('input[inputmode="numeric"]');
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(String(i + 1));
      }

      // Quote Options appear (DynamicVariantGenerator)
      await expect(page.locator('h2', { hasText: 'Build Your Quotation' })).toBeVisible({ timeout: 45000 });

      // Select recommended plan to open Add-ons
      await page.locator('button:has-text("Select Plan")').nth(1).click();

      // Wait for navigation to the addons page (which is the same URL but different viewMode)
      await expect(page.locator('h2', { hasText: 'Build your own system.' })).toBeVisible({ timeout: 15000 });
    });

    // ---------------------------------------------------------
    // STEP 2: The Customizer (Add-ons)
    // ---------------------------------------------------------
    await test.step('Enhance your system', async () => {
      // The FullCustomizerPanel has tabs like "Cameras", "Recorders", "Accessories"
      // Note: We might be directly looking at accessories.
      // Click on an Add button if it exists.
      const accessoriesTab = page.locator('button', { hasText: 'Accessories' }).first();
      if (await accessoriesTab.isVisible()) {
          await accessoriesTab.click();
      }

      // Wait for add-ons to load
      const addBtn = page.locator('button', { hasText: /^Add$/i }).first();
      if (await addBtn.isVisible()) {
          await addBtn.scrollIntoViewIfNeeded();
          await addBtn.click();
          await expect(page.locator('button', { hasText: /^Added$/i }).first()).toBeVisible({ timeout: 15000 });
      }
    });

    // ---------------------------------------------------------
    // STEP 3: Review Details & Book Visit
    // ---------------------------------------------------------
    await test.step('Review & Submit Booking', async () => {
      // Click the "Schedule Site Visit" or "Book Site Visit" button from the SmartContextBar
      await page.locator('button:has-text("Schedule Site Visit"), button:has-text("Book Site Visit")').first().click();

      // Wait for the SiteDetailsModal to appear
      await expect(page.locator('h2', { hasText: 'Pinpoint Your Site' })).toBeVisible({ timeout: 15000 });

      // The pincode might already be filled from the wizard, but let's ensure it's there
      // Check if pincode length is 6, if not fill it
      const pincodeInput = page.locator('input[placeholder="400001"]');
      await pincodeInput.fill('302001');

      // Wait for region fetch
      await page.waitForTimeout(2000);

      // Fill in Primary Landmark
      await page.fill('input[placeholder="Near Metro, Opp. Temple..."]', 'Test Landmark');

      // Fill in Full Address
      await page.fill('textarea[placeholder="Building, Wing, Unit No., Street..."]', '123 E2E Test Street, Automate City');

      // Click Confirm Site
      await page.locator('button', { hasText: 'Confirm Site' }).click();

      // Ensure booking toast appears
      await expect(page.locator('text=Visit Booked!')).toBeVisible({ timeout: 15000 });
    });
  });
});
