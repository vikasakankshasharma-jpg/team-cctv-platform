const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

initializeApp({ 
  credential: cert({ 
    projectId: env['FIREBASE_PROJECT_ID'], 
    clientEmail: env['FIREBASE_CLIENT_EMAIL'], 
    privateKey: env['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n') 
  }), 
  storageBucket: env['FIREBASE_STORAGE_BUCKET'] 
});
const db = getFirestore();

const BASE_URL = 'http://localhost:3000';

async function testFlow(name, reqPayload) {
  console.log('\n========================================');
  console.log('Testing Flow: ' + name);
  console.log('========================================');

  try {
    console.log('[1] Generating Quote...');
    const genRes = await fetch(BASE_URL + '/api/quote/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqPayload)
    });
    if (!genRes.ok) throw new Error('Generate API failed (' + genRes.status + ')');

    const genData = await genRes.json();
    if (!genData.success) throw new Error('Generate Logic failed: ' + genData.message);
    
    const availablePlans = Object.keys(genData.plans);
    console.log('✅ Quote Generated. Available Plans: ' + availablePlans.length);
    if (availablePlans.length === 0) throw new Error('No plans generated!');

    const selectedPlanKey = availablePlans[0];
    const selectedPlan = genData.plans[selectedPlanKey];
    console.log('✅ Selected Plan: ' + selectedPlanKey + ' (Total: ' + selectedPlan.total_payable + ')');

    console.log('[2] Saving Quote & Lead...');
    const savePayload = {
      customer_mobile: reqPayload.customer_mobile,
      customer_name: reqPayload.customer_name,
      requirementSnapshot: genData.requirement,
      configurationSnapshot: genData.configuration,
      pricingSnapshot: selectedPlan,
      selectedPlan: selectedPlanKey
    };

    const saveRes = await fetch(BASE_URL + '/api/quote/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savePayload)
    });
    if (!saveRes.ok) {
       const txt = await saveRes.text();
       throw new Error('Save API failed (' + saveRes.status + '): ' + txt);
    }

    const saveData = await saveRes.json();
    if (!saveData.success) throw new Error('Save Logic failed: ' + saveData.message);
    
    console.log('✅ Quote Saved! Quote ID: ' + saveData.quoteId);

    console.log('[3] Verifying Lead Capture in Firestore...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    let snap = await db.collection('leads').where('mobile_number', '==', reqPayload.customer_mobile).get();
    if (snap.empty) {
       snap = await db.collection('leads').where('customer_mobile', '==', reqPayload.customer_mobile).get();
    }
    
    if (snap.empty) {
      throw new Error('❌ Lead not found in Firestore!');
    } else {
      snap.forEach(doc => {
         const data = doc.data();
         console.log('✅ Verified in DB! Lead ID: ' + doc.id);
         console.log('   Customer: ' + data.customer_name + ', Status: ' + data.status + ', Source: ' + data.source);
      });
    }
  } catch (e) {
    console.error('❌ Flow Failed:', e.message);
  }
}

async function main() {
  await testFlow('Combo 1 - New Installation', {
    installation_type: 'new',
    camera_count: 4, outdoor_camera_count: 2, indoor_camera_count: 2,
    recording_days: 7, recording_mode: 'motion', technology_preference: 'IP',
    wants_remote_viewing: true, customer_name: 'Test Combo 1', customer_mobile: '1111111111'
  });
  await testFlow('Combo 2 - Addon (Compatible DVR)', {
    installation_type: 'addon',
    existing_system_known: true, existing_technology: 'HD', existing_recorder_channels: 8, existing_working_cameras: 4,
    camera_count: 2, retain_existing_storage: true, customer_name: 'Test Combo 2', customer_mobile: '2222222222'
  });
  await testFlow('Combo 3 - Addon (Requires DVR Upgrade)', {
    installation_type: 'addon',
    existing_system_known: true, existing_technology: 'IP', existing_recorder_channels: 4, existing_working_cameras: 4,
    camera_count: 2, retain_existing_storage: false, recording_days: 15, recording_mode: 'motion',
    customer_name: 'Test Combo 3', customer_mobile: '3333333333'
  });
  process.exit(0);
}
main();
