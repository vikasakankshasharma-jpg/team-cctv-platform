require('dotenv').config({ path: '.env.production.local' });
if (!process.env.FIREBASE_PROJECT_ID) require('dotenv').config({ path: '.env.local' });
if (!process.env.FIREBASE_PROJECT_ID) require('dotenv').config({ path: '.env' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const https = require('https');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore(app);

// Import verified quadrants from compiled TS/JS
const { JAIPUR_VERIFIED_QUADRANTS } = require('../lib/geo/jaipurQuadrants.ts');

async function reseed() {
  console.log('=== Reseeding Verified Jaipur Quadrants into Firestore pincode_cache ===');
  const pins = Object.keys(JAIPUR_VERIFIED_QUADRANTS);
  console.log(`Found ${pins.length} verified PIN codes to update.`);

  for (const pin of pins) {
    const quadrants = JAIPUR_VERIFIED_QUADRANTS[pin];
    const docRef = db.collection('pincode_cache').doc(pin);
    const snap = await docRef.get();

    const updatePayload = {
      quadrants,
      updated_at: FieldValue.serverTimestamp()
    };

    if (snap.exists) {
      const data = snap.data();
      // Check if sub_areas has out-of-bounds coordinates (outside Jaipur: lat ~ 26.5-27.5, lng ~ 75.4-76.2)
      if (data) {
        const fieldsToDelete = {};
        for (const [key, val] of Object.entries(data)) {
          if (key.startsWith('sub_areas.') && typeof val === 'object' && val !== null) {
            const lat = val.lat;
            const lng = val.lng;
            if (typeof lat === 'number' && typeof lng === 'number') {
              if (lat < 26.5 || lat > 27.5 || lng < 75.4 || lng > 76.2) {
                console.log(`  [${pin}] Deleting corrupted out-of-bounds coordinate in ${key}: (${lat}, ${lng})`);
                fieldsToDelete[key] = FieldValue.delete();
              }
            }
          }
        }
        if (Object.keys(fieldsToDelete).length > 0) {
          await docRef.update(fieldsToDelete);
        }
      }
    }

    await docRef.set(updatePayload, { merge: true });
    console.log(`✓ Updated PIN ${pin} with authentic verified quadrants (NW: ${quadrants[0].anchor})`);
  }

  console.log('\n=== All Jaipur PIN codes updated successfully! ===');
}

reseed().catch(err => {
  console.error('Reseed failed:', err);
  process.exit(1);
});
