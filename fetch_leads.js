const https = require('https');
const { execSync } = require('child_process');

try {
  const token = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();

  const data = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: "leads" }],
      orderBy: [{ field: { fieldPath: "created_at" }, direction: "DESCENDING" }],
      limit: 5
    }
  });

  const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: '/v1/projects/team-cctv-live-8294/databases/(default)/documents:runQuery',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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

} catch (e) {
  console.error("Error executing gcloud auth", e.message);
}
