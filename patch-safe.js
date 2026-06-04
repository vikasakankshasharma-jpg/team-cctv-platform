const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// 1. Imports
if (!content.includes('CheckSquare')) {
  content = content.replace(
    'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor,',
    'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, CheckSquare, Square,'
  );
}

// 2. Types for SubCategoryGroup and CategorySection
content = content.replaceAll(
  'onToggle: (p: Product) => void;',
  'onToggle: (p: Product) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;'
);

// 3. Destructuring for SubCategoryGroup
content = content.replace(
  'function SubCategoryGroup({',
  'function SubCategoryGroup({ selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup,'
);

// 4. Destructuring for CategorySection
content = content.replace(
  'function CategorySection({',
  'function CategorySection({ selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup,'
);

// 5. ProductInventoryProps
content = content.replace(
  'onFiltersChange?: (filters: { category: string; technology: string }) => void;',
  'onFiltersChange?: (filters: { category: string; technology: string }) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;'
);

// 6. ProductInventory destructuring
content = content.replace(
  'export function ProductInventory({ products, onEdit, onToggle, onFiltersChange }: ProductInventoryProps) {',
  'export function ProductInventory({ products, onEdit, onToggle, onFiltersChange, selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup }: ProductInventoryProps) {'
);

// 7. Pass props down
content = content.replaceAll(
  'onToggle={onToggle}',
  'onToggle={onToggle} selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAllGroup={onSelectAllGroup} onDeselectAllGroup={onDeselectAllGroup}'
);

// 8. Checkbox headers (use exact match from file lines 83-84)
const thTarget = '<th className="px-6 py-3 w-[25%] font-medium">SKU / Information</th>';
const thReplacement = `<th className="px-6 py-3 w-[5%] font-medium text-center">
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
                  <th className="px-6 py-3 w-[20%] font-medium">SKU / Information</th>`;
content = content.replace(thTarget, thReplacement);

// 9. Checkbox row (use line split to be safe)
const lines = content.split('\\n');
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  // Look for the td that wraps the Package icon in tbody
  if (lines[i].includes('<td className="px-6 py-4">') && lines[i+1] && lines[i+1].includes('<div className="flex items-center gap-3">') && lines[i+2] && lines[i+2].includes('<div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">')) {
     // Inject our td BEFORE this td
     newLines.pop(); // remove the <td...>
     newLines.push(`                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onToggleSelect(p.id!)} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(p.id!) ? <CheckSquare className="w-4 h-4 mx-auto text-primary" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>`);
     newLines.push(lines[i]); // put it back
  }
}
content = newLines.join('\\n');

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log('Done!');
