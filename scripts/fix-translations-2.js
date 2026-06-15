const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The corrupted string looks like:
// {brand  "wizard_lbl_environment": "Environment",\n  "wizard_opt_indoor": "Indoor Area",\n ... \n}
// or {city  "wizard_lbl_environment": "वातावरण", \n ... \n}
// We will replace \{([a-zA-Z]+)\s+"wizard_lbl_environment"[^}]*\} with \{$1\}

const brokenRegex = /\{([a-zA-Z]+)\s+"wizard_lbl_environment"[^}]*\}/g;
content = content.replace(brokenRegex, '{$1}');

fs.writeFileSync(filePath, content);
console.log('Cleaned up corrupted injections.');
