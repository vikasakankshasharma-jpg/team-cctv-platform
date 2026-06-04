const fs = require('fs');

let pi = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// The string we want to replace is around line 109-112:
// <td className="px-6 py-4">
//   <div className="flex items-center gap-3">
//     <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">
//       <Package className="w-4 h-4 text-muted-foreground" />
//     </div>

// Let's use a regex to match the start of the first td in the tbody tr
pi = pi.replace(
  /<td className="px-6 py-4">\s*<div className="flex items-center gap-3">/g,
  `<td className="px-6 py-4 text-center">
                    <button onClick={() => onToggleSelect(p.id!)} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(p.id!) ? <CheckSquare className="w-4 h-4 mx-auto text-primary" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', pi);
console.log("Patched tbody Checkbox");
