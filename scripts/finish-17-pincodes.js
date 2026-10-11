const https = require('https');

const pins = ["303124","303903","303806","302049","302044","302047","303706","303122","303805","302041","303338","303106","303807","303123","302039","302042","302048"];

function fetchPin(pin) {
  return new Promise((resolve) => {
    https.get('https://cctvquotation.com/api/pincode/' + pin, (res) => {
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
  console.log('Starting quadrant conversion for remaining ' + pins.length + ' pincodes...');
  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    process.stdout.write('[' + (i + 1) + '/' + pins.length + '] PIN ' + pin + ': ');
    const res = await fetchPin(pin);
    if (res.hasQuadrants) {
      console.log('? Quadrants Ready');
    } else {
      console.log('?? Failed');
    }
    await new Promise(r => setTimeout(r, 4500));
  }
  console.log('All 17 remaining pincodes processed!');
}

run();
