const fs = require('fs');

let page = fs.readFileSync('app/(admin)/admin/products/page.tsx', 'utf8');

// 1. Add state if missing
if (!page.includes('const [selectedIds, setSelectedIds]')) {
  page = page.replace(
    'const [products, setProducts] = useState<Product[]>([]);',
    'const [products, setProducts] = useState<Product[]>([]);\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());'
  );
}

// 2. Add handlers if missing
if (!page.includes('const handleToggleSelect')) {
  const handlers = `
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllGroup = (groupProducts: Product[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      groupProducts.forEach(p => next.add(p.id!));
      return next;
    });
  };

  const handleDeselectAllGroup = (groupProducts: Product[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      groupProducts.forEach(p => next.delete(p.id!));
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
    } catch (error) {
      toast.error("Error deleting products", { id: toastId });
    }
  };
`;
  
  page = page.replace(
    'const handleToggleActive = async (product: Product) => {',
    handlers + '\n  const handleToggleActive = async (product: Product) => {'
  );
}

// 3. Add floating action bar if missing
if (!page.includes('selectedIds.size > 0 && (')) {
  const fab = `
      {selectedIds.size > 0 && (
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

  page = page.replace(
    '{/* ── Modal (Create / Edit) ───────────────────────────────────────── */}',
    fab + '\n      {/* ── Modal (Create / Edit) ───────────────────────────────────────── */}'
  );
}

fs.writeFileSync('app/(admin)/admin/products/page.tsx', page);
console.log("Re-added state and handlers to page.tsx");
