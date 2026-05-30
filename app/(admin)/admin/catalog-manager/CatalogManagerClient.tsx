"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, Settings2, ShieldCheck } from "lucide-react";
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

  // Filters for bulk export sync
  const [activeFilters, setActiveFilters] = useState<{ category: string; technology: string }>({
    category: "",
    technology: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load catalog");
    } finally {
      setIsLoading(false);
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
                />
            </div>
          )
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsForm initialSettings={initialSettings} />
          </div>
        )}
      </main>
    </div>
  );
}
