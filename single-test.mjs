import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3000';

async function run() {
    // Step 1: Create lead
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
    const leadData = await leadRes.json();
    console.log('Lead response:', JSON.stringify(leadData, null, 2));
    const leadId = leadData.data?.id;
    if (!leadId) { console.log('No lead ID!'); return; }

    // Step 2: Generate quote
    const quoteRes = await fetch(BASE_URL + '/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lead_id: leadId,
            status: "draft",
            selection: {
                lead_id: leadId,
                plan_type: "recommended",
                technology: "HD",
                camera_count: 4,
                picture_quality: "good",
                recording_days: 15,
                recording_mode: "motion"
            }
        })
    });
    const quoteData = await quoteRes.json();
    console.log('\nQuote response:', JSON.stringify(quoteData, null, 2));
}

run().catch(console.error);
