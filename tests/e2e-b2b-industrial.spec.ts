import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P0: B2B / Industrial Lead Flow', () => {

  test('Camera count >16 routes to industrial/B2B flow API', async ({ request }) => {
    const industrialPayload = {
      phone: '9876543210',
      requested_camera_count: 24,
      property_type: 'factory',
      technology: 'IP',
      consent: true
    };
    
    const res = await request.post('/api/leads/industrial', {
      data: industrialPayload
    });
    
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();

    // Verify it was saved to the industrial_leads collection
    const doc = await adminDb.collection('industrial_leads').doc(data.id).get();
    expect(doc.exists).toBe(true);
    const docData = doc.data();
    expect(docData?.phone).toBe('9876543210');
    expect(docData?.requested_camera_count).toBe(24);
    expect(docData?.status).toBe('new');
  });

  test('Industrial lead bypasses normal quote generation (> max supported)', async ({ request }) => {
    const reqPayload = {
      property_type: 'factory',
      camera_count: 50,
      technology: 'IP',
      storage_days: 15,
      features: [],
      internet_available: true
    };
    
    const res = await request.post('/api/quote/generate', {
      data: reqPayload
    });
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.configuration.industrial_threshold_exceeded).toBe(true);
    expect(data.configuration.recorder_channels).toBeLessThan(data.configuration.total_cameras);
  });
});

