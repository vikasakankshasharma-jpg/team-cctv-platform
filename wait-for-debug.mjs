import fetch from 'node-fetch';
const BASE_URL = 'https://cctvquotation.com';

async function check() {
    for (let i = 0; i < 20; i++) {
        const leadRes = await fetch(BASE_URL + '/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: "Debug User", mobile_number: "9876543210", firebase_uid: "uid", property_type: "home", technology_choice: "HD", cabling_done: false, wizard_answers: {}
            })
        });
        const text = await leadRes.text();
        if (text.includes('Maintenance: ERROR') || text.includes('Maintenance: DOC_MISSING') || text.includes('Maintenance: DOC_FOUND') || text.includes('Maintenance: MAINTENANCE')) {
            console.log('DEBUG FOUND:', text);
            return;
        }
        console.log('Still waiting for debug deployment...', text);
        await new Promise(r => setTimeout(r, 10000));
    }
}
check();
