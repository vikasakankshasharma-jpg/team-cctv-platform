const fs = require('fs');

// --- Patch ProductInventory.tsx ---
let pi = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Add checkbox icon
pi = pi.replace(
  'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor,',
  'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, CheckSquare, Square,'
);

// Add to props
pi = pi.replace(
  'onFiltersChange?: (filters: { category: string; technology: string }) => void;',
  `onFiltersChange?: (filters: { category: string; technology: string }) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;`
);

pi = pi.replace(
  'export function ProductInventory({ products, onEdit, onToggle, onFiltersChange }: ProductInventoryProps) {',
  'export function ProductInventory({ products, onEdit, onToggle, onFiltersChange, selectedIds, onToggleSelect, onSelectAllGroup, onDeselectAllGroup }: ProductInventoryProps) {'
);

// Pass down to CategorySection
pi = pi.replace(
  /onToggle=\{onToggle\}\s*\/>/g,
  'onToggle={onToggle}\n              selectedIds={selectedIds}\n              onToggleSelect={onToggleSelect}\n              onSelectAllGroup={onSelectAllGroup}\n              onDeselectAllGroup={onDeselectAllGroup}\n            />'
);

// Add to CategorySection props
pi = pi.replace(
  'onToggle: (p: Product) => void;\n}) {',
  'onToggle: (p: Product) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;\n}) {'
);

// Pass down to SubCategoryGroup
pi = pi.replace(
  /onToggle=\{onToggle\}\s*\/>/g,
  'onToggle={onToggle}\n              selectedIds={selectedIds}\n              onToggleSelect={onToggleSelect}\n              onSelectAllGroup={onSelectAllGroup}\n              onDeselectAllGroup={onDeselectAllGroup}\n            />'
);

// Add to SubCategoryGroup props
pi = pi.replace(
  'onToggle: (p: Product) => void;\n}) {',
  'onToggle: (p: Product) => void;\n  selectedIds: Set<string>;\n  onToggleSelect: (id: string) => void;\n  onSelectAllGroup: (products: Product[]) => void;\n  onDeselectAllGroup: (products: Product[]) => void;\n}) {'
);

// Add Checkbox to Table Head
pi = pi.replace(
  '<th className="px-6 py-3 w-[25%] font-medium">SKU / Information</th>',
  `<th className="px-6 py-3 w-[5%] font-medium text-center">
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
                  <th className="px-6 py-3 w-[20%] font-medium">SKU / Information</th>`
);

// Add Checkbox to Table Body Row
pi = pi.replace(
  '<td className="px-6 py-4">\n                    <div className="flex items-center gap-3">',
  `<td className="px-6 py-4 text-center">
                    <button onClick={() => onToggleSelect(p.id!)} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(p.id!) ? <CheckSquare className="w-4 h-4 mx-auto text-primary" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">\n                    <div className="flex items-center gap-3">`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', pi);

// --- Patch AdminProductsPage ---
let page = fs.readFileSync('app/(admin)/admin/products/page.tsx', 'utf8');

// Add Lucide icons
page = page.replace(
  'Loader2, Plus, Save, X, Package, IndianRupee, BadgeDollarSign, Camera, Info, Settings, Tag, Target, HardDrive',
  'Loader2, Plus, Save, X, Package, IndianRupee, BadgeDollarSign, Camera, Info, Settings, Tag, Target, HardDrive, Trash2'
);

// Add State for Selected IDs
page = page.replace(
  'const [products, setProducts] = useState<Product[]>([]);',
  'const [products, setProducts] = useState<Product[]>([]);\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());'
);

// Add Handlers
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
    } catch (err) {
      toast.error("Error deleting products", { id: toastId });
    }
  };
`;
page = page.replace('const handleToggleActive', handlers + '\n  const handleToggleActive');

// Pass props to ProductInventory
page = page.replace(
  'products={products}\n                onEdit={handleEdit}\n                onToggle={handleToggleActive}\n                onFiltersChange={setActiveFilters}',
  'products={products}\n                onEdit={handleEdit}\n                onToggle={handleToggleActive}\n                onFiltersChange={setActiveFilters}\n                selectedIds={selectedIds}\n                onToggleSelect={handleToggleSelect}\n                onSelectAllGroup={handleSelectAllGroup}\n                onDeselectAllGroup={handleDeselectAllGroup}'
);

// Render Floating Action Bar
const floatingBar = `
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

page = page.replace('</main>', floatingBar + '\n        </main>');

fs.writeFileSync('app/(admin)/admin/products/page.tsx', page);
console.log("Patched Bulk UI");
