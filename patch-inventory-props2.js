const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

content = content.replace(
  /<SubCategoryGroup\s+key=\{subLabel\}\s+label=\{subLabel\}\s+products=\{items\}\s+onEdit=\{onEdit\}\s+onToggle=\{onToggle\}/,
  `<SubCategoryGroup
              key={subLabel}
              label={subLabel}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle} selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAllGroup={onSelectAllGroup} onDeselectAllGroup={onDeselectAllGroup}`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log("Patched SubCategoryGroup props passing");
