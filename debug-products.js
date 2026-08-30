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

async function run() {
    const snap = await db.collection('products').get();
    const products = snap.docs.map(d => {
        const data = d.data();
        if (!Array.isArray(data.technologies)) {
            data.technologies = data.technology ? [data.technology] : ['Common'];
        }
        return { id: d.id, ...data };
    });

    const cameras = products.filter(p => p.category === 'cctv_camera');
    console.log('Total cameras:', cameras.length);
    const hdCameras = cameras.filter(p => p.technologies.includes('HD'));
    console.log('HD cameras:', hdCameras.length);
    hdCameras.forEach(c => {
        console.log('  ' + c.id + ': ' + c.display_name + ' | tech=' + JSON.stringify(c.technologies) + ' | active=' + c.is_active + ' | price=' + c.unit_price + ' | res_mp=' + c.resolution_mp + ' | stock_status=' + c.stock_status + ' | stock_qty=' + c.stock_quantity);
    });

    const recorders = products.filter(p => p.category === 'recorder');
    console.log('\nTotal recorders:', recorders.length);
    const hdRecorders = recorders.filter(p => p.technologies.includes('HD'));
    console.log('HD recorders:', hdRecorders.length);
    hdRecorders.forEach(c => {
        console.log('  ' + c.id + ': ' + c.display_name + ' | tech=' + JSON.stringify(c.technologies) + ' | active=' + c.is_active + ' | price=' + c.unit_price + ' | max_cameras=' + c.max_cameras + ' | channels=' + c.channels);
    });

    const storage = products.filter(p => p.category === 'storage');
    console.log('\nTotal storage:', storage.length);
    storage.forEach(c => {
        console.log('  ' + c.id + ': ' + c.display_name + ' | tech=' + JSON.stringify(c.technologies) + ' | active=' + c.is_active + ' | price=' + c.unit_price + ' | storage_tb=' + c.storage_tb);
    });

    const power = products.filter(p => p.category === 'power_device');
    console.log('\nTotal power_device:', power.length);
    power.forEach(c => {
        console.log('  ' + c.id + ': ' + c.display_name + ' | tech=' + JSON.stringify(c.technologies) + ' | active=' + c.is_active + ' | price=' + c.unit_price + ' | max_cameras=' + c.max_cameras);
    });
}

run().catch(console.error);
