const fs = require('fs');

const path = 'components/quotation/FullCustomizerPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'let list = [...products, ...addons].filter(a => a.category === "power_device" &&',
  'let list = [...products, ...addons].filter(a => (a.category === "power_device" || a.category === "power") &&'
);

fs.writeFileSync(path, content);
console.log("Patched components/quotation/FullCustomizerPanel.tsx");
