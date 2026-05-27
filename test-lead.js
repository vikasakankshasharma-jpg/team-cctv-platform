const https = require('https');

const data = JSON.stringify({
  customer_name: "AI Tester",
  mobile_number: "9999999999",
  firebase_uid: "test_uid",
  wizard_answers: { q_tech: "IP", lead_pincode: "302012" },
  property_type: "home",
  technology_choice: "IP",
  cabling_done: false
});

const options = {
  hostname: 'cctvquotation.com',
  port: 443,
  path: '/api/leads',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => { responseBody += chunk; });
  res.on('end', () => {
    console.log(responseBody);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
