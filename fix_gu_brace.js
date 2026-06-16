const fs = require('fs');
let code = fs.readFileSync('lib/i18n/translations.ts', 'utf8');

// Fix Gujarati block closing brace
code = code.replace(/},\r?\n\s*'step_storage_desc':/g, "      'step_storage_desc':");

// Now we need to add the closing brace back for gu
// The end of the file looks like:
//       '3 Months': "3 મહિના",
// };
// We want it to be:
//       '3 Months': "3 મહિના",
//   }
// };
code = code.replace(/'3 Months': "3 મહિના",\r?\n};\r?\n?$/, "'3 Months': \"3 મહિના\",\n  }\n};\n");

fs.writeFileSync('lib/i18n/translations.ts', code);
console.log("Fixed gu closing brace!");
