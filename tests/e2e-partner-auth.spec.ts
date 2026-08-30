import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P0: Partner OTP Auth Lifecycle', () => {

  const TEST_MOBILE = "9999999999";

  test.afterAll(async () => {
    // Cleanup any generated OTPs from the database
    const otps = await adminDb.collection('otps').where('mobile', '==', TEST_MOBILE).get();
    const batch = adminDb.batch();
    otps.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  test('Should successfully complete full OTP generation and verification flow', async ({ request }) => {
    
    // 1. Send OTP Request
    const sendRes = await request.post('/api/send-otp', {
      data: { mobile: TEST_MOBILE }
    });
    
    expect(sendRes.status()).toBe(200);
    const sendData = await sendRes.json();
    expect(sendData.success).toBe(true);
    
    // In dev environment, the code should be returned, otherwise we fetch it from admin DB for testing
    let otpCode = sendData.devCode;

    if (!otpCode) {
      // In production testing, we bypass by reading straight from Firestore
      const otps = await adminDb.collection('otps').where('mobile', '==', TEST_MOBILE).limit(1).get();
      expect(otps.empty).toBe(false);
      otpCode = otps.docs[0].data().code;
    }

    // 2. Fail to verify with wrong OTP
    const wrongVerifyRes = await request.post('/api/verify-otp', {
      data: { mobile: TEST_MOBILE, code: "000000" }
    });
    expect(wrongVerifyRes.status()).toBe(400);

    // 3. Successfully verify with correct OTP
    const correctVerifyRes = await request.post('/api/verify-otp', {
      data: { mobile: TEST_MOBILE, code: otpCode }
    });
    expect(correctVerifyRes.status()).toBe(200);
    const verifyData = await correctVerifyRes.json();
    expect(verifyData.success).toBe(true);

  });

});
