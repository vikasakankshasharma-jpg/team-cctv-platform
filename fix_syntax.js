const fs = require('fs');
const file = 'lib/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

// Fix 1: semi-colon in union type
code = code.replace(/\| 'advance';\n\s*\| "select_plan"/g, "| 'advance'\n  | \"select_plan\"");

// Fix 2: missing comma before newly appended block
// E.g. wizard_smart: "..." \n 'select_plan': ...
code = code.replace(/"Smart System Design"\n\s*'select_plan':/g, "\"Smart System Design\",\n      'select_plan':");
code = code.replace(/"Смартови Дизайн"\n\s*'select_plan':/g, "\"Смартови Дизайн\",\n      'select_plan':"); // example if any

const lines = code.split('\n');
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes("'select_plan':") && i > 0 && !lines[i-1].includes(",") && !lines[i-1].includes("{")) {
     lines[i-1] = lines[i-1] + ",";
  }
}
fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed syntax!');
