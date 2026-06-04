const fs = require('fs');

let page = fs.readFileSync('app/(admin)/admin/catalog-manager/CatalogManagerClient.tsx', 'utf8');

if (!page.includes('selectedIds')) {
  // Add Trash2 icon
  page = page.replace(
    'import { Package, Settings2, ShieldCheck } from "lucide-react";',
    'import { Package, Settings2, ShieldCheck, Trash2 } from "lucide-react";'
  );

  // Add state
  page = page.replace(
    'const [isLoading, setIsLoading] = useState(true);',
    'const [isLoading, setIsLoading] = useState(true);\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());'
  );

  // Add handlers
  const handlers = `
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllGroup = (ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  };

  const handleDeselectAllGroup = (ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(\`Are you sure you want to delete \${selectedIds.size} products? This cannot be undone.\`)) return;

    const toastId = toast.loading(\`Deleting \${selectedIds.size} products...\`);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        toast.success("Products deleted successfully", { id: toastId });
        setSelectedIds(new Set());
        fetchProducts();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting products", { id: toastId });
    }
  };
`;

  page = page.replace('const handleToggleActive', handlers + '\n  const handleToggleActive');

  // Pass props to ProductInventory
  page = page.replace(
    '<ProductInventory \n                  products={products} \n                  onEdit={(p) => window.location.href = \'/admin/products\'} \n                  onToggle={handleToggleActive} \n                  onFiltersChange={setActiveFilters}\n                />',
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

  // Render Floating Action Bar
  const floatingBar = `
        {selectedIds.size > 0 && activeTab === "hardware" && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
             <span className="font-semibold text-sm text-foreground">{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</span>
             <div className="w-px h-6 bg-border" />
             <div className="flex items-center gap-3">
               <button onClick={() => setSelectedIds(new Set())} className="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
               <button onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                 <Trash2 className="w-4 h-4" /> Delete Selected
               </button>
             </div>
          </div>
        )}
`;

  page = page.replace('</main>', floatingBar + '\n      </main>');

  fs.writeFileSync('app/(admin)/admin/catalog-manager/CatalogManagerClient.tsx', page);
  console.log("Patched Bulk UI onto CatalogManagerClient");
} else {
  console.log("Already patched");
}
