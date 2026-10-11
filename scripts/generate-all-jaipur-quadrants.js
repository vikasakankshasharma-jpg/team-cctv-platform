const https = require('https');

const missingPins = [
  "302038", "303305", "303301", "303012", "303604", "303007", "303904", "303008", "303124", 
  "303603", "303903", "303601", "303001", "303119", "303702", "303120", "303712", "303701", 
  "303108", "303107", "303806", "302049", "302046", "302044", "302047", "303706", "303908", 
  "303122", "303805", "302041", "303338", "303106", "303807", "303102", "303123", "303121", 
  "302019", "302039", "302042", "302048", "303329"
];

function fetchPin(pin) {
  return new Promise((resolve) => {
    https.get(`https://cctvquotation.com/api/pincode/${pin}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const hasQ = !!(json.quadrants && json.quadrants.length > 0);
          resolve({ pin, success: true, hasQuadrants: hasQ });
        } catch (e) {
          resolve({ pin, success: false, error: e.message });
        }
      });
    }).on('error', (err) => {
      resolve({ pin, success: false, error: err.message });
    });
  });
}

async function run() {
  console.log(`Starting generation for ${missingPins.length} pincodes...`);
  for (let i = 0; i < missingPins.length; i++) {
    const pin = missingPins[i];
    process.stdout.write(`[${i + 1}/${missingPins.length}] Processing ${pin}... `);
    const result = await fetchPin(pin);
    if (result.hasQuadrants) {
      console.log('✅ Generated');
    } else {
      console.log('⚠️ No quadrants generated or invalid pincode');
    }
    // Wait 4 seconds between requests to be well within 15 RPM limit
    await new Promise(r => setTimeout(r, 4200));
  }
  console.log("All done! Purging cache on /api/admin/geo...");
  https.get(`https://cctvquotation.com/api/admin/geo?type=offices&state=rajasthan&district=jaipur&refresh=true`, (res) => {
    console.log("Cache refreshed, HTTP status:", res.statusCode);
  });
}

run();
