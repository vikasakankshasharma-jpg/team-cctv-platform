const fs = require('fs');

let page = fs.readFileSync('app/(admin)/admin/catalog-manager/CatalogManagerClient.tsx', 'utf8');

// The replacement was failing due to spacing. Let's use Regex.
page = page.replace(
  /<ProductInventory[\s\S]*?onFiltersChange=\{setActiveFilters\}\s*\/>/m,
  `<ProductInventory 
                  products={products} 
                  onEdit={(p) => window.location.href = '/admin/products'} 
                  onToggle={handleToggleActive} 
                  onFiltersChange={setActiveFilters}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAllGroup={handleSelectAllGroup}
                  onDeselectAllGroup={handleDeselectAllGroup}
                />`
);

fs.writeFileSync('app/(admin)/admin/catalog-manager/CatalogManagerClient.tsx', page);
console.log("Properly patched ProductInventory call");
