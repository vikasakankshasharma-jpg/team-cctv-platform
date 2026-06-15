import { test, expect } from '@playwright/test';

test('Verify Live Website Spec Table', async ({ page }) => {
  test.setTimeout(60000); 
  
  // Navigate directly to the user's live quote link
  await page.goto('https://cctvquotation.com/quote/cLXFJ3jZ2Ql4IHq4SCus');
  
  // Wait for the Comparison section (might be "Curated Packages" now)
  await page.waitForSelector('text=Curated Packages', { timeout: 30000 });
  await page.waitForTimeout(3000); // Give pricing engine a moment to execute

  // Assert that the spec table Resolution column is NOT empty dashes
  const resCell = page.locator('text="Resolution"').locator('xpath=following-sibling::div[1]');
  
  // Check if it's visible. If not, maybe we need to expand a section?
  // The table is not collapsed by default in the new code, but let's just grab the text.
  const resText = await resCell.innerText();
  console.log("LIVE - Resolution in Standard Column:", resText);
  expect(resText).not.toBe("-");
  expect(resText).toContain("MP");

  console.log("SUCCESS! The live website has successfully updated and is populating specs.");
});
