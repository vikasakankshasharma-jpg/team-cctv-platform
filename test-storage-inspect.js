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
async function inspect() {
    const sSnap = await db.collection('products').where('category', '==', 'storage').get();
    console.log('--- STORAGE PRODUCTS ---');
    sSnap.docs.forEach(d => {
        const data = d.data();
        console.log(d.id, '|', data.display_name, '| brand:', data.brand, '| storage_tb:', data.storage_tb, '| price:', data.unit_price, '| cost:', data.base_cost, '| active:', data.is_active, '| stock_status:', data.stock_status);
    });

    const rSnap = await db.collection('products').where('category', '==', 'recorder').get();
    console.log('\n--- RECORDER PRODUCTS ---');
    rSnap.docs.forEach(d => {
        const data = d.data();
        console.log(d.id, '|', data.display_name, '| tech:', data.technology, '| ch:', data.channels || data.max_cameras, '| sata:', data.sata_slots || (data.display_name.includes('2SATA') ? 2 : 1));
    });
}
inspect();
