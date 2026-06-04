const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Replace usages of selectedIds.has to safely check selectedIds
content = content.replaceAll(
  'selectedIds.has(p.id!)',
  '(selectedIds && selectedIds.has(p.id!))'
);

content = content.replace(
  'function CategorySection({ selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup,',
  'function CategorySection({ selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {},'
);

content = content.replace(
  'function SubCategoryGroup({ selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup,',
  'function SubCategoryGroup({ selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {},'
);

content = content.replace(
  'export function ProductInventory({ products, onEdit, onToggle, onFiltersChange, selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup }: ProductInventoryProps)',
  'export function ProductInventory({ products, onEdit, onToggle, onFiltersChange, selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {} }: ProductInventoryProps)'
);

// also fix the ProductInventoryProps
content = content.replace(
  'selectedIds: Set<string>;',
  'selectedIds?: Set<string>;'
);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log('Patched ProductInventory to be safe against undefined selectedIds');
