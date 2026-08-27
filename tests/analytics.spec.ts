import { test, expect } from '@playwright/test';

test.describe('Phase 3B: Analytics Dashboard', () => {

  test('Overview API returns aggregated metrics', async ({ request }) => {
    const res = await request.get('/api/analytics/overview?range=30');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBeTruthy();
    expect(typeof data.data.totalQuotes).toBe('number');
    expect(typeof data.data.totalPipelineValue).toBe('number');
    expect(typeof data.data.avgQuoteValue).toBe('number');
  });

  test('Rejections API returns logged validation errors', async ({ request }) => {
    const res = await request.get('/api/analytics/rejections');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBeTruthy();
    expect(Array.isArray(data.data.logs)).toBeTruthy();
    expect(typeof data.data.breakdown).toBe('object');
  });

  test('Products API returns intelligence metrics', async ({ request }) => {
    const res = await request.get('/api/analytics/products');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBeTruthy();
    expect(Array.isArray(data.data.mostRecommended)).toBeTruthy();
    expect(Array.isArray(data.data.highestGrossing)).toBeTruthy();
    expect(typeof data.data.attachmentRate).toBe('number');
  });
  test('Phase 3B.1: Funnel Tracking API logs sessions correctly', async ({ request }) => {
    // 1. Start a Session
    const sessionId = "test-session-" + Date.now();
    const startRes = await request.post('/api/analytics/track', {
      data: { sessionId, source: "wizard", eventType: "SESSION_START", step: 1 }
    });
    expect(startRes.status()).toBe(200);
    
    // 2. Progress to step 3
    await request.post('/api/analytics/track', {
      data: { sessionId, source: "wizard", eventType: "STEP_VIEWED", step: 3 }
    });

    // 3. Fetch Funnel API
    const funnelRes = await request.get('/api/analytics/funnel');
    const funnelData = await funnelRes.json();
    
    expect(funnelData.success).toBeTruthy();
    expect(funnelData.data.totalStarted).toBeGreaterThanOrEqual(1);
    // Since we progressed to step 3, cameraCount (step 2) and recording (step 3) should be counted for this session
    expect(typeof funnelData.data.drops.recording).toBe('number');
  });
});
