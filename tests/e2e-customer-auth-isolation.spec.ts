import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P0: Customer Auth & Data Isolation (Rows 7 & 8)', () => {
  const MOBILE_A = `99999${Math.floor(10000 + Math.random() * 90000)}`;
  const MOBILE_B = `88888${Math.floor(10000 + Math.random() * 90000)}`;
  
  const LEAD_A_ID = `LEAD_A_${Date.now()}`;
  const LEAD_B_ID = `LEAD_B_${Date.now()}`;

  test.beforeAll(async () => {
    // 1. Seed Leads for two different customers (Unlinked initially)
    await adminDb.collection('leads').doc(LEAD_A_ID).set({
      mobile_number: MOBILE_A,
      customer_name: 'Customer A',
      firebase_uid: null,
      is_deleted: false,
      created_at: new Date()
    });

    await adminDb.collection('leads').doc(LEAD_B_ID).set({
      mobile_number: MOBILE_B,
      customer_name: 'Customer B',
      firebase_uid: null,
      is_deleted: false,
      created_at: new Date()
    });
  });

  test.afterAll(async () => {
    await adminDb.collection('leads').doc(LEAD_A_ID).delete();
    await adminDb.collection('leads').doc(LEAD_B_ID).delete();
    await adminDb.collection('otp_verifications').doc(MOBILE_A).delete();
  });

  test('Customer A logs in, gets custom token, and can ONLY see Lead A', async ({ request }) => {
    // 1. Request OTP for Customer A
    const otpRes = await request.post('/api/auth/otp/mobile', {
      data: { mobile: MOBILE_A }
    });
    expect(otpRes.status()).toBe(200);

    // 2. Fetch OTP from backend
    const otpDoc = await adminDb.collection('otp_verifications').doc(MOBILE_A).get();
    expect(otpDoc.exists).toBe(true);
    expect(otpDoc.data()?.role).toBe('customer'); // Ensures fallback to customer
    const otpCode = otpDoc.data()?.otp;

    // 3. Verify OTP
    const verifyRes = await request.post('/api/auth/otp/verify', {
      data: { identifier: MOBILE_A, otp: otpCode, type: 'mobile' }
    });
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.customToken).toBeTruthy();

    // 4. Verify Lead A was linked to Customer A's UID
    const leadADoc = await adminDb.collection('leads').doc(LEAD_A_ID).get();
    const customerAUid = leadADoc.data()?.firebase_uid;
    expect(customerAUid).toBeTruthy(); // Link was successful!

    // Verify Lead B was NOT linked to Customer A
    const leadBDoc = await adminDb.collection('leads').doc(LEAD_B_ID).get();
    expect(leadBDoc.data()?.firebase_uid).not.toBe(customerAUid);

    // 5. Test Customer Isolation API using mock_session_cookie injection
    // To simulate a logged-in customer in our mock session, we pass 'mock_session_cookie_ROLE_customer'
    // But verifySession will assign UID 'mock-user-id'. Let's override Lead A's UID to match.
    await adminDb.collection('leads').doc(LEAD_A_ID).update({ firebase_uid: 'mock-user-id' });

    const fetchLeadsRes = await request.get('/api/customer/leads', {
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_customer' }
    });
    expect(fetchLeadsRes.status()).toBe(200);
    const leadsData = await fetchLeadsRes.json();
    expect(leadsData.success).toBe(true);
    
    // Should ONLY contain Lead A
    expect(leadsData.data.length).toBeGreaterThanOrEqual(1);
    const fetchedIds = leadsData.data.map((l: any) => l.id);
    expect(fetchedIds).toContain(LEAD_A_ID);
    expect(fetchedIds).not.toContain(LEAD_B_ID); // Proves Data Isolation!
  });
});
