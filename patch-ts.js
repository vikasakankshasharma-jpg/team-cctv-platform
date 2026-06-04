const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Fix 1: allSelected check
content = content.replace(
  'const allSelected = products.every(p => selectedIds?.has(p.id));',
  'const allSelected = products.every(p => p.id && selectedIds?.has(p.id));'
);

// Fix 2: someSelected check
content = content.replace(
  'const someSelected = products.some(p => selectedIds?.has(p.id));',
  'const someSelected = products.some(p => p.id && selectedIds?.has(p.id));'
);

// Fix 3 & 4: mapped ids
content = content.replace(
  'onDeselectAllGroup?.(products.map(p => p.id));',
  'onDeselectAllGroup?.(products.map(p => p.id).filter((id): id is string => !!id));'
);
content = content.replace(
  'onSelectAllGroup?.(products.map(p => p.id));',
  'onSelectAllGroup?.(products.map(p => p.id).filter((id): id is string => !!id));'
);

// Fix 5 & 6: isSelected and toggle
content = content.replace(
  'const isSelected = selectedIds?.has(p.id);',
  'const isSelected = p.id ? selectedIds?.has(p.id) : false;'
);

content = content.replace(
  'onToggleSelect?.(p.id)',
  'if(p.id) onToggleSelect?.(p.id)'
);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log("Patched ProductInventory.tsx typescript errors");
