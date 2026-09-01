const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('.env.local', 'utf8');
const match = content.match(/FIREBASE_PRIVATE_KEY="(.*?)"/s);

if (match) {
  const rawKey = match[1]; 
  fs.writeFileSync('temp_firebase_key.txt', rawKey);
  try { execSync('npx vercel env rm FIREBASE_PRIVATE_KEY production -y', { stdio: 'ignore' }); } catch(e) {}
  execSync('npx vercel env add FIREBASE_PRIVATE_KEY production < temp_firebase_key.txt', { stdio: 'inherit' });
  fs.unlinkSync('temp_firebase_key.txt');
  console.log('Fixed Firebase Key with .env.local version');
} else {
  console.log('Key not found');
}
