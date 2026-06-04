const fs = require('fs');

let page = fs.readFileSync('app/(admin)/admin/products/page.tsx', 'utf8');

// Replace the ProductInventory invocation in page.tsx
page = page.replaceAll(
  'onFiltersChange={setActiveFilters}',
  'onFiltersChange={setActiveFilters}\n                selectedIds={selectedIds}\n                onToggleSelect={handleToggleSelect}\n                onSelectAllGroup={handleSelectAllGroup}\n                onDeselectAllGroup={handleDeselectAllGroup}'
);

fs.writeFileSync('app/(admin)/admin/products/page.tsx', page);
console.log("Patched page.tsx");
