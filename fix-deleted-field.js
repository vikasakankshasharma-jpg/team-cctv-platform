require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
});
const db = admin.firestore();

async function fixProducts() {
    const snap = await db.collection('products').get();
    const batch = db.batch();
    let count = 0;
    for (const doc of snap.docs) {
        const data = doc.data();
        if (data.is_deleted === undefined) {
            batch.update(doc.ref, { is_deleted: false });
            count++;
        }
    }
    if (count > 0) {
        await batch.commit();
        console.log('Fixed ' + count + ' products (added is_deleted=false)');
    } else {
        console.log('All products already have is_deleted field');
    }
    
    // Also fix addons
    const addonsSnap = await db.collection('addons').get();
    const batch2 = db.batch();
    let count2 = 0;
    for (const doc of addonsSnap.docs) {
        const data = doc.data();
        if (data.is_deleted === undefined) {
            batch2.update(doc.ref, { is_deleted: false });
            count2++;
        }
    }
    if (count2 > 0) {
        await batch2.commit();
        console.log('Fixed ' + count2 + ' addons (added is_deleted=false)');
    } else {
        console.log('All addons already have is_deleted field');
    }
}

fixProducts().catch(console.error);
