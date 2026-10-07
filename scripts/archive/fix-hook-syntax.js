const fs = require('fs');
const path = 'hooks/usePincodeCoverage.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync(path, code);
