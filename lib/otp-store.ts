import { adminDb } from "./firebase-admin";

/**
 * Generates a 6-digit OTP, stores it in Firestore with a 5-minute expiry, and resets attempts.
 * Returns the generated code.
 */
export async function generateOtp(mobile: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  await adminDb.collection("temp_otps").doc(mobile).set({
    code,
    expiresAt,
    attempts: 0,
  });

  return code;
}

/**
 * Verifies the OTP code for a given mobile number.
 * Allows maximum 3 attempts and deletes the OTP document upon success or maximum attempts reached.
 */
export async function verifyOtp(mobile: string, code: string): Promise<boolean> {
  const docRef = adminDb.collection("temp_otps").doc(mobile);
  const doc = await docRef.get();

  if (!doc.exists) {
    return false;
  }

  const data = doc.data();
  if (!data) return false;

  // Check expiry
  const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (Date.now() > expiresAt.getTime()) {
    await docRef.delete();
    return false;
  }

  // Check attempts
  if (data.attempts >= 3) {
    await docRef.delete();
    return false;
  }

  const isMatched = data.code === code;

  if (isMatched) {
    // Delete OTP document on successful verification
    await docRef.delete();
    return true;
  } else {
    // Increment attempts
    await docRef.update({
      attempts: data.attempts + 1,
    });
    return false;
  }
}
