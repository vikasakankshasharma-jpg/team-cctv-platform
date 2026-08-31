import fetch from 'node-fetch';
const BASE_URL = 'https://cctvquotation.com';

async function run() {
    console.log('Hitting /api/submissions...');
    const leadRes = await fetch(BASE_URL + '/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer_name: "Debug Test User",
            mobile_number: "9876543210",
            firebase_uid: "debug_uid_" + Date.now(),
            property_type: "home",
            technology_choice: "HD",
            cabling_done: false,
            wizard_answers: { pincode: "302001", city: "Jaipur", state: "Rajasthan" }
        })
    });
    
    if (!leadRes.ok) {
        console.error('Lead submission failed with status:', leadRes.status);
        const text = await leadRes.text();
        console.error('Response text:', text);
        return;
    }
    
    const leadData = await leadRes.json();
    console.log('Lead response:', JSON.stringify(leadData, null, 2));
    const leadId = leadData.data?.id;
    if (!leadId) { console.log('No lead ID!'); return; }

    console.log('Hitting /api/quotes...');
    const quoteRes = await fetch(BASE_URL + '/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lead_id: leadId,
            status: "draft",
            configuration: {
                splitCameras: false,
                cameraCount: 4,
                storageDays: 15,
                conduitType: "PVC Pipe"
            }
        })
    });
    
    if (!quoteRes.ok) {
        console.error('Quote generation failed with status:', quoteRes.status);
        const text = await quoteRes.text();
        console.error('Response text:', text);
        return;
    }
    
    const quoteData = await quoteRes.json();
    console.log('Quote response:', JSON.stringify(quoteData, null, 2));
}
run();
