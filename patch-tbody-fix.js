const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Replace the specific td block with the two tds
const target = `<td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">`;

const replacement = `<td className="px-6 py-4 text-center">
                    <button onClick={(e) => { e.stopPropagation(); onToggleSelect(p.id!); }} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(p.id!) ? <CheckSquare className="w-4 h-4 mx-auto text-primary" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">`;

// Note: To handle \r\n, we use regex that allows optional \r
const regexTarget = /<td className="px-6 py-4">\r?\n\s*<div className="flex items-center gap-3">\r?\n\s*<div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">/g;

content = content.replace(regexTarget, replacement);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log('Fixed table body alignment!');
