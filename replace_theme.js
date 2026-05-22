const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'components', 'admin'),
  path.join(__dirname, 'components', 'dealer'),
  path.join(__dirname, 'app', '(admin)'),
  path.join(__dirname, 'app', '(dealer)')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. Remove backdrop-blur-*
  content = content.replace(/backdrop-blur-(sm|md|lg|xl|2xl|3xl|none)\s?/g, '');
  content = content.replace(/backdrop-blur\s?/g, '');

  // 2. Solidify Backgrounds
  content = content.replace(/bg-zinc-900\/[0-9]+/g, 'bg-zinc-900');
  content = content.replace(/bg-zinc-950\/[0-9]+/g, 'bg-zinc-900');
  content = content.replace(/bg-black\/[0-9]+/g, 'bg-black');
  content = content.replace(/bg-white\/[0-9]+/g, 'bg-white');

  // 3. Solidify Borders
  content = content.replace(/border-zinc-800\/[0-9]+/g, 'border-zinc-800');

  // 4. Tone down shadows
  content = content.replace(/shadow-2xl/g, 'shadow-md');
  content = content.replace(/shadow-xl/g, 'shadow-md');

  // 5. Normalize extremely rounded radii
  content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[36px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[40px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[48px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-3xl/g, 'rounded-2xl');

  // 6. Fix double spaces that might be left over from class removal
  content = content.replace(/className="([^"]+)"/g, (match, p1) => {
    return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', filePath);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

targetDirs.forEach(dir => traverse(dir));
console.log('Done.');
