import { test, expect } from '@playwright/test';

test.describe('Quote & Booking End-to-End Flow', () => {
  // Increase timeout for this full flow since it tests many screens
  test.setTimeout(120000); 

  test('Complete Customer Journey: Wizard -> Quote -> Customizer -> Review -> Booking', async ({ page }) => {
    
    // ---------------------------------------------------------
    // STEP 1: The Wizard
    // ---------------------------------------------------------
    await test.step('Seed and Fill out the Customer Wizard', async () => {
      // Ensure the DB has exactly the structure this test expects
      await page.goto('/api/dev/seed-wizard');
      await page.waitForTimeout(2000); // Give the DB a moment
      
      await page.goto('/wizard');

      // Step 0: Property Type (single -> auto-advances)
      await page.getByText('Home / Residential', { exact: true }).click();

      // Step 1: Setup Type (single -> auto-advances)
      await page.getByText('New Installation', { exact: true }).click();

      // Step 2: Camera Technology (single -> auto-advances)
      await page.getByText('IP Network Camera (Smart Digital)', { exact: true }).click();

      // Step 3: Camera Count (number -> requires Continue)
      await page.locator('input[type="number"]').first().fill('4');
      await page.getByRole('button', { name: /Continue/i }).click();

      // Step 4: Camera Technology (single -> auto-advances)
      await page.getByText('Smart Digital IP Cameras (Recommended)', { exact: true }).click();

      // Step 5: Recording Storage (single -> auto-advances)
      await page.getByText('1 Week (Standard)', { exact: true }).click();

      // Step 5.5: Dynamic Image Resolution (single -> auto-advances)
      // Since it's dynamic based on DB products, we click the first available resolution option
      // await page.getByText(/MP /i).first().click();

      // Step 6: Features (multi -> requires Continue)
      await page.getByText('Microphone', { exact: true }).click();
      await page.getByRole('button', { name: /Continue/i }).click();

      // Step 7: Wiring (multi-question on same step)
      await page.getByText('No – Full installation required', { exact: true }).click();
      // Clicking the last single-choice question auto-advances!
      await page.getByText('Conduit Flat Pipe', { exact: true }).click();

      // Step 8: Timeline (single -> auto-advances)
      await page.getByText('Within a week', { exact: true }).click();

      // Step 9: Brand (single -> auto-advances)
      await page.getByText('Unsure, please recommend the best value', { exact: true }).click();

      // Step 10: Maintenance (single -> last step does not auto-advance)
      await page.getByText("No, I'll manage it myself", { exact: true }).click();
      
      // The last step does NOT auto-advance. Must click Generate Quote.
      await page.getByRole('button', { name: /Generate Quote/i }).click();

      // Lead Gate appears
      await expect(page.locator('text=Unlock Your Proposal')).toBeVisible({ timeout: 15000 });

      // Fill Lead Gate details (Use bypass value)
      await page.fill('input[placeholder="Enter mobile number"]', '9999999999');
      await page.fill('input[placeholder="Enter full name"]', 'E2E Test User');
      await page.fill('input[placeholder="6-digit pincode"]', '302001');
      
      // Send OTP
      await page.click('button:has-text("Send Verification Code")');

      // Wait for OTP form to appear
      await expect(page.locator('text=Verify Your Number')).toBeVisible({ timeout: 15000 });
      
      // Fill the 6 OTP input boxes
      const otpInputs = page.locator('input[inputmode="numeric"]');
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(String(i + 1));
      }

      await page.click('button:has-text("Verify & View Quote")');

      // Wait for navigation to the quotation page
      await expect(page).toHaveURL(/\/quote\/.+/, { timeout: 15000 });
    });

    // ---------------------------------------------------------
    // STEP 2: Quotation Dashboard (Compare Featured Systems)
    // ---------------------------------------------------------
    await test.step('View Quotation Dashboard', async () => {
      // Wait for the comparison cards to load
      await expect(page.locator('h1', { hasText: /Your security/i })).toBeVisible({ timeout: 15000 });
      
      // Ensure that we see the cards
      await expect(page.locator('button:has-text("Select")').first()).toBeVisible();
    });

    // ---------------------------------------------------------
    // STEP 3: The Customizer
    // ---------------------------------------------------------
    await test.step('Open Build Your Own Customizer', async () => {
      // Scroll to the FullCustomizerPanel (Pro Customizer)
      await expect(page.locator('h3', { hasText: 'Configuration Tool' })).toBeVisible();

      // Switch to Accessories tab
      await page.locator('button', { hasText: 'Accessories' }).click();

      // Wait for add-ons to load
      await expect(page.locator('button', { hasText: /^Add$/i }).first()).toBeVisible();
      
      // Click Add on the first available Addon
      await page.locator('button', { hasText: /^Add$/i }).first().click();

      // Ensure it changes to Added
      await expect(page.locator('button', { hasText: /^Added$/i }).first()).toBeVisible();
    });

    // ---------------------------------------------------------
    // STEP 4: Review Details & Book Visit
    // ---------------------------------------------------------
    await test.step('Review & Submit Booking', async () => {
      // Removed the summary section check as it's no longer present.

      // Click the "Book Site Visit" button from the SmartContextBar
      await page.locator('button', { hasText: 'Book Site Visit' }).click();

      // Wait for the SiteDetailsModal to appear
      await expect(page.locator('h2', { hasText: 'Pinpoint Your Site' })).toBeVisible();

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
