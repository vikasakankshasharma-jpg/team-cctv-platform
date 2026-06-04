const fs = require('fs');
let c = fs.readFileSync('app/(admin)/admin/products/page.tsx', 'utf8');

const target = `<div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Technical SKU</label>`;

const replacement = `<div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Vendor ID</label>
                          <input type="text" value={editingProduct.vendor_id || ""} onChange={e => setEditingProduct({...editingProduct, vendor_id: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. megajaipur" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Vendor Product ID</label>
                          <input type="text" value={editingProduct.vendor_product_id || ""} onChange={e => setEditingProduct({...editingProduct, vendor_product_id: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono" placeholder="e.g. MEGA-5MP" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Technical SKU</label>`;

c = c.replace(target, replacement);
fs.writeFileSync('app/(admin)/admin/products/page.tsx', c);
console.log("Patched successfully");
