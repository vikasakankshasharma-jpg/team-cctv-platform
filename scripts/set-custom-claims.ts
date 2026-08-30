import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Ensure GOOGLE_APPLICATION_CREDENTIALS is set in env)
if (!admin.apps.length) {
  admin.initializeApp();
}

async function setRole(email: string, role: string) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role });
    console.log(`✅ Successfully granted role '${role}' to user ${email}`);
  } catch (error) {
    console.error(`❌ Error setting role for ${email}:`, error);
  }
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.log("Usage: npx ts-node scripts/set-custom-claims.ts <email> <role>");
    console.log("Roles: super_admin, admin, sales, operations, technician");
    process.exit(1);
  }

  const [email, role] = args;
  await setRole(email, role);
  process.exit(0);
}

run();
