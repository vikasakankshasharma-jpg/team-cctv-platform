const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

// 1. Add keys to TranslationKey type definition
const keysToAdd = [
  '"step_storage_desc"',
  '"step_features_desc"',
  '"step_general_addons_desc"',
  '"No Storage Required"',
  '"3 Months"'
];

let typeEndIndex = code.indexOf('export const translations = {');
let typeDef = code.substring(0, typeEndIndex);

for (const key of keysToAdd) {
  if (!typeDef.includes(key)) {
    typeDef = typeDef.trim() + `\n  | ${key}\n\n`;
  }
}

let restOfCode = code.substring(typeEndIndex);

// 2. We need to remove the first occurrences of `wiz_sel_all` and `wiz_multi` within en, hi, mr, gu blocks,
// OR simply remove my appended lines at the bottom of the blocks (since they caused TS error 1117).
// BUT wait, my appended lines have the correct translations for hi, mr, gu!
// If I remove my appended lines, I lose the translations!
// It's safer to remove the UNQUOTED 'wiz_sel_all' and 'wiz_multi' from the entire file.

// The original ones look like:
//       wiz_sel_all: "Select all that apply",
//       wiz_multi: "You can pick more than one option...",
// Let's replace those with nothing using regex.
restOfCode = restOfCode.replace(/[ \t]*wiz_sel_all:\s*["'].*?["'],?\r?\n/g, '');
restOfCode = restOfCode.replace(/[ \t]*wiz_multi:\s*["'].*?["'],?\r?\n/g, '');

code = typeDef + restOfCode;

fs.writeFileSync(srcFile, code, 'utf8');
console.log('Fixed typescript errors!');
