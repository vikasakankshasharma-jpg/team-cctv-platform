import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.staging explicitly for verification
const envPath = path.resolve(process.cwd(), '.env.staging');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback to default if they rename it to .env
}

console.log('🔍 Running Staging Configuration Sanity Check...\n');

let hasErrors = false;

function checkMissing(varName: string) {
  if (!process.env[varName] || process.env[varName] === '') {
    console.error(`❌ MISSING: ${varName} is required.`);
    hasErrors = true;
  } else {
    console.log(`✅ FOUND: ${varName}`);
  }
}

function checkMustNotExist(varName: string) {
  if (process.env[varName]) {
    console.error(`❌ FATAL SECURITY RISK: ${varName} MUST NOT exist in staging/production! (Found: ${process.env[varName]})`);
    hasErrors = true;
  } else {
    console.log(`✅ SECURE: ${varName} is unset (Cloud mode active).`);
  }
}

// 1. Emulator Variables (MUST NOT EXIST)
checkMustNotExist('FIRESTORE_EMULATOR_HOST');
checkMustNotExist('FIREBASE_AUTH_EMULATOR_HOST');
checkMustNotExist('FIREBASE_STORAGE_EMULATOR_HOST');

console.log('---');

// 2. Firebase Admin & Core Credentials (MUST EXIST)
checkMissing('GOOGLE_APPLICATION_CREDENTIALS');
checkMissing('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
checkMissing('NEXT_PUBLIC_FIREBASE_API_KEY');

console.log('---');

// 3. Razorpay Test Credentials (MUST EXIST)
checkMissing('NEXT_PUBLIC_RAZORPAY_KEY_ID');
checkMissing('RAZORPAY_KEY_SECRET');
checkMissing('PAYMENT_WEBHOOK_SECRET');

console.log('---');

// 4. WhatsApp Staging Credentials (MUST EXIST)
checkMissing('WHATSAPP_API_TOKEN');
checkMissing('WHATSAPP_PHONE_NUMBER_ID');
checkMissing('WHATSAPP_BUSINESS_ACCOUNT_ID');

console.log('\n========================================');
if (hasErrors) {
  console.error('🚨 SANITY CHECK FAILED: Staging environment is improperly configured.');
  console.error('🚨 DO NOT DEPLOY. Fix the errors above first.');
  process.exit(1);
} else {
  console.log('🎉 SANITY CHECK PASSED: Environment is ready for Staging 8-Gate Run!');
  process.exit(0);
}
