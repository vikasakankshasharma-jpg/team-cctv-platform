const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

content = content.replace(
  'onClick={() => if(p.id) onToggleSelect?.(p.id)}',
  'onClick={() => p.id && onToggleSelect?.(p.id)}'
);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log("Patched ProductInventory.tsx JSX syntax error");
