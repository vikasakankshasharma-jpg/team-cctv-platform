require('dotenv').config({ path: '.env.production.local' });
if (!process.env.FIREBASE_PROJECT_ID) require('dotenv').config({ path: '.env.local' });
if (!process.env.FIREBASE_PROJECT_ID) require('dotenv').config({ path: '.env' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const https = require('https');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore(app);

const formatAreaName = (name) =>
  name
    .replace(/\s+(S\.O|B\.O|H\.O|G\.P\.O\.|S\.O\.|B\.O\.|H\.O\.)(\s+|$)/gi, ' ')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();

function fetchIndiaPost(pin) {
  return new Promise((resolve) => {
    https.get('https://api.postalpincode.in/pincode/' + pin, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json[0]?.PostOffice || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanse() {
  console.log('=== Cleaning all legacy compass quadrants from Firestore pincode_cache ===');
  const snap = await db.collection('pincode_cache').get();
  console.log(`Inspecting ${snap.size} cached PIN codes...`);

  const legacyDocs = [];
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const quads = data.quadrants || [];
    const hasCompass = quads.some((q) =>
      ['North-West', 'North-East', 'South-East', 'South-West', 'north-west', 'north-east', 'south-east', 'south-west'].includes(
        String(q.zone || '').trim()
      )
    );
    if (hasCompass) {
      legacyDocs.push({ id: doc.id, data });
    }
  });

  console.log(`Found ${legacyDocs.length} PIN codes with legacy compass zones.`);

  for (let i = 0; i < legacyDocs.length; i++) {
    const { id: pin, data } = legacyDocs[i];
    console.log(`[${i + 1}/${legacyDocs.length}] Cleansing PIN ${pin}...`);

    if (pin === '302046') {
      const fixedHubs = [
        {
          zone: 'Sector 1 Circle',
          anchor: 'Malviya Nagar Police Station Circle',
          coverage: 'Malviya Nagar Sector 1, Sector 2, Pindarao Nagar'
        },
        {
          zone: 'World Trade Park',
          anchor: 'World Trade Park',
          coverage: 'Malviya Nagar Industrial Area, Siddharth Nagar, Shanti Path'
        },
        {
          zone: 'Gaurav Tower',
          anchor: 'Gaurav Tower',
          coverage: 'Malviya Nagar Sector 3, Sector 4, Malviya Nagar Extension'
        },
        {
          zone: 'Apex Hospital',
          anchor: 'Apex Institute of Medical Sciences',
          coverage: 'Malviya Nagar Sector 10, Sector 11, Model Town'
        }
      ];
      await db.collection('pincode_cache').doc(pin).set(
        {
          quadrants: fixedHubs,
          delivery_hubs: fixedHubs
        },
        { merge: true }
      );
      console.log(`  -> Fixed 302046 with authentic local landmarks.`);
      continue;
    }

    const postOffices = await fetchIndiaPost(pin);
    if (postOffices && postOffices.length > 0) {
      // Sort Delivery offices and Sub Post Offices / Head Post Offices first
      const sorted = [...postOffices].sort((a, b) => {
        const aDel = a.DeliveryStatus === 'Delivery' ? 1 : 0;
        const bDel = b.DeliveryStatus === 'Delivery' ? 1 : 0;
        if (aDel !== bDel) return bDel - aDel;
        const aSO = a.BranchType === 'Sub Post Office' || a.BranchType === 'Head Post Office' ? 1 : 0;
        const bSO = b.BranchType === 'Sub Post Office' || b.BranchType === 'Head Post Office' ? 1 : 0;
        return bSO - aSO;
      });

      const topOffices = sorted.slice(0, 8);
      const deliveryHubs = topOffices.map((po) => {
        const cleanName = formatAreaName(po.Name);
        const branchLabel = po.BranchType ? ` (${po.BranchType})` : '';
        return {
          zone: cleanName,
          anchor: `${po.Name}${branchLabel}`,
          coverage: `${cleanName} and surrounding delivery beats`
        };
      });

      await db.collection('pincode_cache').doc(pin).set(
        {
          quadrants: deliveryHubs,
          delivery_hubs: deliveryHubs
        },
        { merge: true }
      );
      console.log(`  -> Cleansed ${pin} with ${deliveryHubs.length} authentic delivery hubs: ${deliveryHubs.map(h => h.zone).join(', ')}`);
    } else {
      // If postal API has no record, purge legacy quadrants field
      const { FieldValue } = require('firebase-admin/firestore');
      await db.collection('pincode_cache').doc(pin).update({
        quadrants: FieldValue.delete(),
        delivery_hubs: FieldValue.delete()
      }).catch(() => {});
      console.log(`  -> Purged legacy quadrants from ${pin} (no postal record found).`);
    }

    // Rate-limiting delay to respect India Post API
    await delay(350);
  }

  console.log('=== All legacy compass quadrants successfully cleansed! ===');
}

cleanse().catch((err) => {
  console.error('Cleansing failed:', err);
  process.exit(1);
});
