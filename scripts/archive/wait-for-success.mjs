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
        if (!text.includes('SYSTEM_MAINTENANCE')) {
            console.log('SUCCESS! Quote API is working:', text);
            return;
        }
        console.log('Still waiting for redeploy...', text);
        await new Promise(r => setTimeout(r, 10000));
    }
}
check();
