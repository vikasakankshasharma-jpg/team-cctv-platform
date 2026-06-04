"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import type { AppSettings, Product } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";

// Products components
import { ProductInventory } from "@/components/admin/ProductInventory";
import { BulkImportExport } from "@/components/admin/BulkImportExport";

interface CatalogManagerClientProps {
  initialSettings: AppSettings;
}

export default function CatalogManagerClient({ initialSettings }: CatalogManagerClientProps) {
  const [activeTab, setActiveTab] = useState<"hardware" | "services">("hardware");
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters for bulk export sync
  const [activeFilters, setActiveFilters] = useState<{ category: string; technology: string }>({
    category: "",
    technology: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => { console.log("fetchProducts started");
    try {
      console.log("fetching from API..."); const res = await fetch("/api/admin/products", { cache: "no-store", headers: { "Cache-Control": "no-cache" } }); console.log("API response status:", res.status);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) { console.error("fetchProducts caught error:", error);
      console.error("Failed to load products:", error);
      toast.error("Failed to load catalog");
    } finally { console.log("fetchProducts finally block");
      setIsLoading(false);
    }
  };

  
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
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} products? This cannot be undone.`)) return;

    const toastId = toast.loading(`Deleting ${selectedIds.size} products...`);
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

  const handleToggleActive = async (product: Product) => {
    const id = product.id!;
    const currentStatus = product.is_active;
    try {
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      
      if (!res.ok) throw new Error("Update failed");
      toast.success(currentStatus ? "Marked Out of Stock" : "Marked In Stock");
    } catch (error) {
      setProducts(products.map(p => p.id === id ? { ...p, is_active: currentStatus } : p));
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (product: Product) => {
    // Navigate to full edit modal if needed, or implement inline
    // Actually, we can just redirect to the products page for editing, or bring the modal here.
    // Let's redirect to standard products page for deep editing for now to reuse it perfectly,
    // or just render the modal here. We'll redirect to avoid duplicating the complex modal.
    window.location.href = `/admin/products`;
  };

  return (
    <div className="bg-background min-h-screen pb-24 transition-colors duration-500">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Unified Dashboard</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Catalog & Pricing Manager</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === "hardware" && (
              <BulkImportExport 
                onImportSuccess={fetchProducts}
                activeFilters={activeFilters}
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex gap-8">
          <button
            onClick={() => setActiveTab("hardware")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "hardware" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Hardware Inventory
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "services" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Labor & Wire Pricing
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {activeTab === "hardware" ? (
          isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading catalog...</div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <ProductInventory 
                  products={products} 
                  onEdit={(p) => window.location.href = '/admin/products'} 
                  onToggle={handleToggleActive} 
                  onFiltersChange={setActiveFilters}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAllGroup={handleSelectAllGroup}
                  onDeselectAllGroup={handleDeselectAllGroup}
                />
            </div>
          )
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsForm initialSettings={initialSettings} />
          </div>
        )}
      
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

      </main>
    </div>
  );
}
