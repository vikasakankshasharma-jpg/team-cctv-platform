const { execSync } = require('child_process');
const fs = require('fs');
const content = fs.readFileSync('.env.production', 'utf8');
const match = content.match(/FIREBASE_PRIVATE_KEY="(.*?)"/s);
if (match) {
  const rawKey = match[1]; // literal \n characters
  fs.writeFileSync('temp_firebase_key.txt', rawKey);
  try { execSync('npx vercel env rm FIREBASE_PRIVATE_KEY production -y', { stdio: 'ignore' }); } catch(e) {}
  execSync('npx vercel env add FIREBASE_PRIVATE_KEY production < temp_firebase_key.txt', { stdio: 'inherit' });
  fs.unlinkSync('temp_firebase_key.txt');
  console.log('Fixed Firebase Key');
} else {
  console.log('Key not found');
}
