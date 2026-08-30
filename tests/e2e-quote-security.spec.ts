import { test, expect } from '@playwright/test';

test.describe('P0: Quote Generation Authorization & Mutation Protection', () => {

  test('Unauthorized caller cannot generate privileged quotes', async ({ request }) => {
    // Attempt to hit the admin custom quote API without a token
    const res = await request.post('/api/admin/quotes/custom', {
      data: {
        leadId: 'mock-lead-123',
        lineItems: [],
        total_payable: 10000
      }
    });
    
    expect(res.status()).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  test('Client cannot manipulate server-calculated financial fields (Quote Mutation Protection)', async ({ request }) => {
    // If a client attempts to submit a quote with manipulated pricing, does the server recalculate?
    // Wait, the client generates the quote via /api/quote/generate which calculates pricing server-side.
    // Let's test that the server returns its own calculation regardless of client passing bad data.
    const res = await request.post('/api/quote/generate', {
      data: {
        property_type: 'home',
        camera_count: 4,
        technology: 'IP',
        storage_days: 7,
        features: [],
        internet_available: true,
        // malicious payload: try to force cost to 1
        total_payable: 1
      }
    });
    
    expect(res.status()).toBe(200);
    const data = await res.json();
    
    // The server should ignore the malicious total_payable and calculate the real price
    expect(data.plans.budget.total_payable).toBeGreaterThan(100);
  });
});

