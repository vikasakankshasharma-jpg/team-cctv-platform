const fs = require('fs');

let pi = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Patch SubCategoryGroup
pi = pi.replace(
`function SubCategoryGroup({
  label,
  products,
  onEdit,
  onToggle,
}: {`,
`function SubCategoryGroup({
  label,
  products,
  onEdit,
  onToggle,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup
}: {`
);

// Patch CategorySection
pi = pi.replace(
`function CategorySection({
  categoryKey,
  products,
  onEdit,
  onToggle,
}: {`,
`function CategorySection({
  categoryKey,
  products,
  onEdit,
  onToggle,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup
}: {`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', pi);
console.log("Patched destructuring");
