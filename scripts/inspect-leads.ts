import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

async function check() {
  const db = admin.firestore();
  const snap = await db.collection('leads').orderBy('created_at', 'desc').limit(5).get();
  console.log('Total recent leads:', snap.docs.length);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log('==================================================');
    console.log('LEAD ID:', d.id);
    console.log('Created At:', data.created_at);
    console.log('Customer:', data.customer_name, '| Mobile:', data.mobile_number);
    console.log('Technology Choice:', data.technology_choice);
    console.log('Camera Count:', data.camera_count);
    console.log('Wizard Answers:', JSON.stringify(data.wizard_answers, null, 2));
  });
}

check().catch(console.error);
