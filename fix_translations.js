const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

// 1. Add keys to TranslationKey
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
code = typeDef + code.substring(typeEndIndex);

// 2. Remove duplicate 'wiz_sel_all' and 'wiz_multi' from the END of each block
// Wait, my append script added them with single quotes: 'wiz_sel_all': ...
// But they already existed without quotes or with quotes?
// We will simply remove the newly appended lines.
// The appended lines look like:
//       'wiz_sel_all': "लागू होने वाले सभी चुनें",
//       'wiz_multi': "आप एक से अधिक विकल्प चुन सकते हैं। हो जाने पर 'जारी रखें' पर क्लिक करें।",

const regexDuplicates = /[ \t]*'wiz_sel_all':.*?\n[ \t]*'wiz_multi':.*?\n/g;
// Wait, if I remove them completely, I will lose the translations I just added because the ORIGINAL ones were in English!
// Let me update the ORIGINAL ones and then remove the duplicates.

const originalKeys = [
  'wiz_sel_all',
  'wiz_multi'
];

let lines = code.split('\n');
// Let's do it manually line by line
let newLines = [];
let seenInBlock = new Set();
let inBlock = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^[ \t]*[a-zA-Z]+: \{/)) {
    inBlock = true;
    seenInBlock = new Set();
    newLines.push(line);
    continue;
  }
  if (inBlock && line.includes('},') && line.trim() === '},') {
    inBlock = false;
    newLines.push(line);
    continue;
  }
  
  if (inBlock) {
    let match = line.match(/^[ \t]*['"]?([a-zA-Z0-9_ ]+)['"]?\s*:/);
    if (match) {
      const key = match[1];
      if (seenInBlock.has(key)) {
        // This is a duplicate. Wait, since the appended one is at the bottom, 
        // the FIRST one we see is the old one. We should actually REMOVE the old one!
        // So if we see a duplicate key later, we want to KEEP the later one.
        // But doing it dynamically in a single pass is hard.
      }
      seenInBlock.add(key);
    }
  }
}

