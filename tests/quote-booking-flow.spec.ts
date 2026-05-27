import { test, expect } from '@playwright/test';

test.describe('Quote & Booking End-to-End Flow', () => {
  // Increase timeout for this full flow since it tests many screens
  test.setTimeout(120000); 

  test('Complete Customer Journey: Wizard -> Quote -> Customizer -> Review -> Booking', async ({ page }) => {
    
    // ---------------------------------------------------------
    // STEP 1: The Wizard
    // ---------------------------------------------------------
    await test.step('Fill out the Customer Wizard', async () => {
      await page.goto('/wizard');

      // Step 0: Property Type (single -> auto-advances)
      await page.getByText('Home / Residential', { exact: true }).click();

      // Step 1: Setup Type (single -> auto-advances)
      await page.getByText('New Installation', { exact: true }).click();

      // Step 2: Camera Count (number -> requires Continue)
      await page.locator('input[type="number"]').fill('4');
      await page.getByRole('button', { name: /Continue/i }).click();

      // Step 3: Camera Technology (single -> auto-advances)
      await page.getByText('IP Network Camera (Smart Digital)', { exact: true }).click();

      // Step 4: Recording Storage (single -> auto-advances)
      await page.getByText('15 Days', { exact: true }).click();

      // Step 5: Special Features (multi -> requires Continue)
      await page.getByText('Not required (Standard cameras are fine)', { exact: true }).click();
      await page.getByRole('button', { name: /Continue/i }).click();

      // Step 6: Image Resolution (single -> auto-advances)
      await page.getByText('2MP Standard HD — Good for most homes', { exact: true }).click();

      // Step 7: Accessories (multi -> requires Continue)
      await page.getByText('No extra accessories needed', { exact: true }).click();
      await page.getByRole('button', { name: /Continue/i }).click();

      // Step 8: Site Overview (2 single questions)
      // Click Q1
      await page.getByText('Standard (Up to 10ft)', { exact: true }).click();
      // Click Q2 (since it is the last question of the last step, it doesn't auto-advance)
      await page.getByText('Concrete / Brick Wall', { exact: true }).click();
      
      // The last step does NOT auto-advance. Must click Generate Quote.
      await page.getByRole('button', { name: /Generate Quote/i }).click();

      // Lead Gate appears
      await expect(page.locator('text=Unlock Your Proposal')).toBeVisible({ timeout: 15000 });

      // Fill Lead Gate details (Use bypass value)
      await page.fill('input[placeholder="98765 43210"]', '9999999999');
      await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'E2E Test User');
      await page.fill('input[placeholder="e.g. 302001"]', '302001');
      await page.fill('input[placeholder="name@example.com"]', 'e2e@example.com');
      
      // Send OTP
      await page.click('button:has-text("Send Verification Code")');

      // Wait for OTP form to appear
      await expect(page.locator('text=Enter Your Code')).toBeVisible({ timeout: 15000 });
      
      // Fill the 6 OTP input boxes
      const otpInputs = page.locator('input[inputmode="numeric"]');
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(String(i + 1));
      }

      await page.click('button:has-text("Verify & Access Proposal")');

      // Wait for navigation to the quotation page
      await expect(page).toHaveURL(/\/quote\/.+/, { timeout: 15000 });
    });

    // ---------------------------------------------------------
    // STEP 2: Quotation Dashboard (Compare Featured Systems)
    // ---------------------------------------------------------
    await test.step('View Quotation Dashboard', async () => {
      // Wait for the comparison cards to load
      await expect(page.locator('h1', { hasText: /Your Security.*Quote/i })).toBeVisible({ timeout: 15000 });
      
      // Ensure that we see the cards
      await expect(page.locator('text=Choose Plan').first()).toBeVisible();
    });

    // ---------------------------------------------------------
    // STEP 3: The Customizer
    // ---------------------------------------------------------
    await test.step('Open Build Your Own Customizer', async () => {
      // Scroll to the FullCustomizerPanel (Pro Customizer)
      await expect(page.locator('h3', { hasText: 'Pro Customizer' })).toBeVisible();

      // Switch to Add-ons tab
      await page.locator('button', { hasText: 'Add-ons' }).click();

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
      // Ensure the summary section is present
      await expect(page.locator('text=What Happens Next?')).toBeVisible();

      // Click the "Accept Quote" button from the ActionPanel
      await page.locator('button', { hasText: 'Accept Quote' }).click();

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

      // Ensure navigation happens and Review page loads
      await expect(page).toHaveURL(/\/quote\/.+\/review\/.+/, { timeout: 15000 });
      await expect(page.locator('text=BILL TO')).toBeVisible();
    });
  });
});
