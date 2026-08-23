const fs = require('fs');
const file = 'lib/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Extract all keys from 'en: {' block
const enStart = code.indexOf('en: {');
const enEnd = code.indexOf('},', enStart);
const enBlock = code.substring(enStart, enEnd);

const keys = new Set();
// Match keys like `  'some_key': "...",` or `  some_key: "...",`
const keyRegex = /^\s*(?:'([^']+)'|"([^"]+)"|([a-zA-Z0-9_]+))\s*:/gm;
let match;
while ((match = keyRegex.exec(enBlock)) !== null) {
  const key = match[1] || match[2] || match[3];
  if (key && key !== 'en') {
    keys.add(key);
  }
}

const allKeys = Array.from(keys);
console.log(`Found ${allKeys.length} keys in 'en' block.`);

// 2. Rebuild the TranslationKey type
let newType = "export type TranslationKey =\n";
newType += allKeys.map(k => `  | '${k}'`).join('\n');
newType += ";\n";

code = code.replace(/export type TranslationKey =[\s\S]*?;\n/, newType);

fs.writeFileSync(file, code);
console.log("Updated TranslationKey type.");
