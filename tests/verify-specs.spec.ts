import { test, expect } from '@playwright/test';

test('Verify Spec Table shows specs', async ({ page }) => {
  test.setTimeout(120000); 
  
  // Go straight to the quote to save time. Using the visual test mock link.
  await page.goto('/quote/mock-lead?name=E2E+Visual+Client&mobile=9988776655');
  
  // Wait for the Comparison section
  await page.waitForSelector('text=Curated Packages', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // Assert that the spec table Resolution column is NOT empty dashes
  const resCell = page.locator('text="Resolution"').locator('xpath=following-sibling::div[1]');
  const resText = await resCell.innerText();
  console.log("Resolution in Standard Column:", resText);
  expect(resText).not.toBe("-");
  expect(resText).toContain("MP");

  // Check Night Vision
  const nvCell = page.locator('text="Night Vision"').locator('xpath=following-sibling::div[1]');
  const nvText = await nvCell.innerText();
  console.log("Night Vision in Standard Column:", nvText);
  expect(nvText).not.toBe("-");
  
  // Check Form Factor
  const formCell = page.locator('text="Form Factor"').locator('xpath=following-sibling::div[1]');
  const formText = await formCell.innerText();
  console.log("Form Factor in Standard Column:", formText);
  expect(formText).not.toBe("-");

  console.log("SUCCESS! All specs populated correctly.");
});
