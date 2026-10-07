const https = require('https');
require('dotenv').config({ path: '.env.local' });

async function getMapplsToken() {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.MAPPLS_CLIENT_ID.replace(/[\r\n"']/g, ''),
      client_secret: process.env.MAPPLS_CLIENT_SECRET.replace(/[\r\n"']/g, '')
    }).toString();

    const options = {
      hostname: 'outpost.mappls.com',
      port: 443,
      path: '/api/security/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function geocode(token, address) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'atlas.mappls.com',
      port: 443,
      path: '/api/places/geocode?address=' + encodeURIComponent(address),
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const t = await getMapplsToken();
  if (t.access_token) {
    const g = await geocode(t.access_token, 'Indra Bazar, 302001, India');
    console.log(JSON.stringify(g, null, 2));
  } else {
    console.log(t);
  }
}
run();
