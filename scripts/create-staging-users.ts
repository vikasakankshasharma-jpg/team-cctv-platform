import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load .env.staging
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging') });

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set in .env.staging');
  process.exit(1);
}

const resolvedCredPath = path.resolve(credPath);
if (!fs.existsSync(resolvedCredPath)) {
  console.error(`❌ Service account file not found at: ${resolvedCredPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(resolvedCredPath, 'utf8'));

try {
  admin.app();
} catch {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

interface StagingUser {
  email: string;
  password: string;
  displayName: string;
  role: string;
}

const stagingUsers: StagingUser[] = [
  { email: 'superadmin@team-staging.test', password: 'Staging@123!', displayName: 'Super Admin (Staging)', role: 'super_admin' },
  { email: 'sales@team-staging.test',      password: 'Staging@123!', displayName: 'Sales User (Staging)',  role: 'sales' },
  { email: 'installer@team-staging.test',  password: 'Staging@123!', displayName: 'Installer (Staging)',   role: 'operations' },
  { email: 'customer@team-staging.test',   password: 'Staging@123!', displayName: 'Customer (Staging)',    role: 'customer' },
];

async function createOrUpdateUser(user: StagingUser) {
  try {
    let uid: string;
    try {
      const existing = await auth.getUserByEmail(user.email);
      uid = existing.uid;
      console.log(`  ℹ️  User already exists: ${user.email} (uid: ${uid})`);
    } catch {
      const created = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`  ✅ Created: ${user.email} (uid: ${uid})`);
    }

    await auth.setCustomUserClaims(uid, { role: user.role });
    console.log(`  🏷️  Role set: ${user.role} → ${user.email}`);
    return { email: user.email, uid, role: user.role };
  } catch (err: any) {
    console.error(`  ❌ Error for ${user.email}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('\n🔧 Creating Staging Test Users with Custom Claims...\n');
  const results = [];
  for (const user of stagingUsers) {
    const result = await createOrUpdateUser(user);
    results.push(result);
  }

  console.log('\n========================================');
  console.log('📋 STAGING USER CREDENTIALS SUMMARY');
  console.log('========================================');
  results.filter(Boolean).forEach(r => {
    console.log(`  Role: ${r!.role.padEnd(12)} | Email: ${r!.email} | Password: Staging@123!`);
  });
  console.log('\n✅ All staging users ready!');
  process.exit(0);
}

run();
