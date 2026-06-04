const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

content = content.replace(
  /interface ProductInventoryProps \{\s*products: Product\[\];\s*onEdit: \(p: Product\) => void;\s*onToggle: \(p: Product\) => void;\s*onFiltersChange\?: \(filters: \{ category: string; technology: string \}\) => void;\s*\}/,
  `interface ProductInventoryProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
  onFiltersChange?: (filters: { category: string; technology: string }) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (products: Product[]) => void;
  onDeselectAllGroup?: (products: Product[]) => void;
}`
);

content = content.replace(
  /export function ProductInventory\(\{ products, onEdit, onToggle, onFiltersChange \}: ProductInventoryProps\) \{/,
  `export function ProductInventory({ products, onEdit, onToggle, onFiltersChange, selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {} }: ProductInventoryProps) {`
);

content = content.replace(
  /function CategorySection\(\{ categoryKey, products, onEdit, onToggle \}: \{ categoryKey: string; products: Product\[\]; onEdit: \(p: Product\) => void; onToggle: \(p: Product\) => void \}\) \{/,
  `function CategorySection({ categoryKey, products, onEdit, onToggle, selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {} }: { categoryKey: string; products: Product[]; onEdit: (p: Product) => void; onToggle: (p: Product) => void; selectedIds?: Set<string>; onToggleSelect?: (id: string) => void; onSelectAllGroup?: (products: Product[]) => void; onDeselectAllGroup?: (products: Product[]) => void }) {`
);

content = content.replace(
  /function SubCategoryGroup\(\{ selectedIds = new Set\(\), onToggleSelect = \(\) => \{\}, onSelectAllGroup = \(\) => \{\}, onDeselectAllGroup = \(\) => \{\},/g,
  `function SubCategoryGroup({ selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {},` // This is probably redundant if it didn't change but I'll make sure SubCategoryGroup has props.
);

content = content.replace(
  /function SubCategoryGroup\(\{ label, products, onEdit, onToggle \}: \{ label: string; products: Product\[\]; onEdit: \(p: Product\) => void; onToggle: \(p: Product\) => void \}\) \{/,
  `function SubCategoryGroup({ label, products, onEdit, onToggle, selectedIds = new Set(), onToggleSelect = () => {}, onSelectAllGroup = () => {}, onDeselectAllGroup = () => {} }: { label: string; products: Product[]; onEdit: (p: Product) => void; onToggle: (p: Product) => void; selectedIds?: Set<string>; onToggleSelect?: (id: string) => void; onSelectAllGroup?: (products: Product[]) => void; onDeselectAllGroup?: (products: Product[]) => void }) {`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log("Patched ProductInventory.tsx props");
