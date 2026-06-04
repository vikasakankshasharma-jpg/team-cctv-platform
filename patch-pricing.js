const fs = require('fs');

const path = 'lib/pricing-engine.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const options = addons.filter(a => a.category === "power_device" &&',
  'const options = addons.filter(a => (a.category === "power_device" || a.category === "power") &&'
);

fs.writeFileSync(path, content);
console.log("Patched lib/pricing-engine.ts");
