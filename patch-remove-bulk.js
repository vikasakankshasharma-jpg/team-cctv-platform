const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

const targetRenderLoop = `selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAllGroup={onSelectAllGroup} onDeselectAllGroup={onDeselectAllGroup}`;

content = content.replace(new RegExp(targetRenderLoop, 'g'), '');

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log("Removed selectedIds references");
