const fs = require('fs');
let lines = fs.readFileSync('lib/pricing-engine-v2.ts', 'utf8').split('\n');
lines[144] = '      display_name: `Installation & Termination (${req.technology_preference})`,';
fs.writeFileSync('lib/pricing-engine-v2.ts', lines.join('\n'));
