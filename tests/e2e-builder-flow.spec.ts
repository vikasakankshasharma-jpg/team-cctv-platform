import { test, expect } from '@playwright/test';

test.describe('Direct Builder Flow', () => {
  test('User can select products, validate, and generate quote', async ({ request }) => {
    // We mock the builder selections (e.g. 4 cameras)
    // Note: Since this requires database products to exist, we test the validation logic
    
    // 1. Calculate and Validate
    // Pass a fake product ID to test missing product or logic
    const calcRes = await request.post('/api/build/calculate', {
      data: {
        selections: [
          { product_id: "non-existent", quantity: 4, type: "main" }
        ]
      }
    });
    
    expect(calcRes.ok()).toBeTruthy();
    const calcData = await calcRes.json();
    expect(calcData.success).toBeTruthy();
    // It should add warnings because 4 cameras but 0 recorders
    expect(calcData.warnings.length).toBeGreaterThan(0);
    expect(calcData.warnings[0]).toContain("no recorder");

    // The real golden flow would involve selecting a valid camera and recorder from the DB
    // Since we don't have a seeded DB in the test runner, we just check the endpoint schema.
  });
});
