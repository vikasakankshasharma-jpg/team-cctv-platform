const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// 1. Imports
if (!content.includes('CheckSquare')) {
  content = content.replace(
    'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor,',
    'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, CheckSquare, Square,'
  );
}

// 2. SubCategoryGroup Type
content = content.replace(
  /onToggle: \(p: Product\) => void;\n}\)/g,
  `onToggle: (p: Product) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;\n})`
);

// 3. SubCategoryGroup destructuring
content = content.replace(
  /function SubCategoryGroup\(\{\n  label,\n  products,\n  onEdit,\n  onToggle,\n\}: \{/g,
  `function SubCategoryGroup({\n  label,\n  products,\n  onEdit,\n  onToggle,\n  selectedIds,\n  onToggleSelect,\n  onSelectAllGroup,\n  onDeselectAllGroup\n}: {`
);

// 4. CategorySection Type
content = content.replace(
  /function CategorySection\(\{\n  categoryKey,\n  products,\n  onEdit,\n  onToggle,\n\}: \{/g,
  `function CategorySection({\n  categoryKey,\n  products,\n  onEdit,\n  onToggle,\n  selectedIds,\n  onToggleSelect,\n  onSelectAllGroup,\n  onDeselectAllGroup\n}: {`
);

// 5. ProductInventoryProps
content = content.replace(
  /onFiltersChange\?: \(filters: \{ category: string; technology: string \}\) => void;\n\}/g,
  `onFiltersChange?: (filters: { category: string; technology: string }) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;\n}`
);

// 6. ProductInventory destructuring
content = content.replace(
  /export function ProductInventory\(\{ products, onEdit, onToggle, onFiltersChange \}: ProductInventoryProps\) \{/g,
  `export function ProductInventory({ products, onEdit, onToggle, onFiltersChange, selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup }: ProductInventoryProps) {`
);

// 7. Pass props to CategorySection
content = content.replace(
  /onToggle=\{onToggle\}\n            \/>/g,
  `onToggle={onToggle}\n              selectedIds={selectedIds}\n              onToggleSelect={onToggleSelect}\n              onSelectAllGroup={onSelectAllGroup}\n              onDeselectAllGroup={onDeselectAllGroup}\n            />`
);

// 8. Pass props to SubCategoryGroup
content = content.replace(
  /onToggle=\{onToggle\}\n            \/>/g, // same match, but will hit both because /g
  `onToggle={onToggle}\n              selectedIds={selectedIds}\n              onToggleSelect={onToggleSelect}\n              onSelectAllGroup={onSelectAllGroup}\n              onDeselectAllGroup={onDeselectAllGroup}\n            />`
);

// 9. Checkbox headers
content = content.replace(
  /<th className="px-6 py-3 w-\[25%\] font-medium">SKU \/ Information<\/th>/g,
  `<th className="px-6 py-3 w-[5%] font-medium text-center">
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         const allSelected = products.every(p => selectedIds.has(p.id!));
                         if (allSelected) onDeselectAllGroup(products);
                         else onSelectAllGroup(products);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {products.every(p => selectedIds.has(p.id!)) ? <CheckSquare className="w-4 h-4 mx-auto text-primary" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 w-[20%] font-medium">SKU / Information</th>`
);

// 10. Checkbox row
content = content.replace(
  /<td className="px-6 py-4">\s*<div className="flex items-center gap-3">\s*<div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">/g,
  `<td className="px-6 py-4 text-center">
                    <button onClick={() => onToggleSelect(p.id!)} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(p.id!) ? <CheckSquare className="w-4 h-4 mx-auto text-primary" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log('Done!');
