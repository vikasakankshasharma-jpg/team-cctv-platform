const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

async function ensureUser(uid) {
  try {
    await admin.auth().getUser(uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      await admin.auth().createUser({ uid });
    }
  }
}

async function getSessionCookie(uid, customClaims) {
  await ensureUser(uid);
  await admin.auth().setCustomUserClaims(uid, customClaims);
  const customToken = await admin.auth().createCustomToken(uid, customClaims);
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=' + API_KEY;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Referer': 'https://cctvquotation.com/'
    },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  const sessionCookie = await admin.auth().createSessionCookie(data.idToken, { expiresIn: 60 * 60 * 1000 });
  return sessionCookie;
}

async function run() {
  try {
    const adminCookie = await getSessionCookie('test_admin_id', { role: 'super_admin' });
    const installerCookie = await getSessionCookie('test_installer_id', { role: 'installer' });
    
    console.log('ADMIN_COOKIE=' + adminCookie);
    console.log('INSTALLER_COOKIE=' + installerCookie);
    
  } catch (err) {
    console.error(err);
  }
}

run();
