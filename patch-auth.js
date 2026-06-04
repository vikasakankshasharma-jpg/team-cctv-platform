const fs = require('fs');

const files = [
  'scripts/vendor-sync.js',
  'scripts/vendor-discovery.js',
  'scripts/vendor-scrape-products.js'
];

const newAuthBlock = `require('dotenv').config({ path: '.env.local' });
if (!process.env.FIREBASE_PROJECT_ID) {
  console.log("⚠️  Could not find FIREBASE_PROJECT_ID in .env.local");
  process.exit(1);
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    })
  });
}`;

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  // Replace the try-catch block for service-account-key.json with the new auth block
  c = c.replace(/try\s*\{\s*const serviceAccount.*?catch\s*\(e\)\s*\{\s*console\.log\("⚠️  Could not find service-account-key\.json.*?"\);\s*process\.exit\(1\);\s*\}/s, newAuthBlock);
  fs.writeFileSync(file, c);
});
console.log("Patched authentication logic in all scripts");
