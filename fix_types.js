const fs = require('fs');
const file = 'lib/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

const enBlockMatch = code.match(/en:\s*{([\s\S]*?)},\n\s+hi:/);
if (enBlockMatch) {
  const enBlock = enBlockMatch[1];
  const keyRegex = /^\s*['"]?([\w-]+)['"]?:\s*['"]/gm;
  let keys = new Set();
  let m;
  while ((m = keyRegex.exec(enBlock)) !== null) {
    keys.add(m[1]);
  }
  
  const newUnion = 'export type TranslationKey =\n  | "' + Array.from(keys).join('"\n  | "') + '";';
  code = code.replace(/export type TranslationKey =[\s\S]*?(?=export const translations)/, newUnion + '\n\n');
  fs.writeFileSync(file, code);
  console.log('Successfully regenerated TranslationKey union with ' + keys.size + ' keys.');
} else {
  console.log('Could not find EN block');
}
