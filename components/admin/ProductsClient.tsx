"use client";

import { useState } from "react";
import { Plus, Pencil, Trash, Package } from "lucide-react";
import type { Product } from "@/types";
import { ProductModal } from "./ProductModal";
import { PageHeader } from "./PageHeader";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/products";

interface ProductsClientProps {
  initialProducts: Product[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleSave = async (data: any) => {
    if (editingProduct?.id) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setIsModalOpen(false);
  };

  const TECH_COLORS: Record<string, string> = {
    IP: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    HD: "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    both: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
  };

  const CATEGORY_COLORS: Record<string, string> = {
    camera: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
    recorder: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    accessory: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
  };

  return (
    <>
      <PageHeader
        icon={Package}
        title="Products Catalog"
        description="Manage cameras, recorders, and accessories used in the quotation engine."
        badge={`${initialProducts.length} SKUs`}
        action={
          <button
            onClick={handleCreateNew}
            className="group flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            New Product
          </button>
        }
      />

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-6">Product Entity</th>
                <th className="px-8 py-6">Classification</th>
                <th className="px-8 py-6">Logic Tier</th>
                <th className="px-8 py-6 text-right">Unit Matrix</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-center">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-500 dark:text-zinc-400">
              {initialProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-inner">
                        <Package className="w-8 h-8 text-zinc-300 dark:text-zinc-800" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-900 dark:text-white font-black text-xl uppercase tracking-widest leading-none">Catalog Empty</p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-tight">Synchronize your first SKU component to begin.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                initialProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row font-medium">
                    <td className="px-8 py-6">
                      <div className="font-black text-zinc-900 dark:text-white text-base leading-tight group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors uppercase tracking-tight">{product.display_name}</div>
                      {product.technical_name && (
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800" /> {product.technical_name}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner border shadow-zinc-900/5 dark:shadow-none ${CATEGORY_COLORS[product.category] || "bg-zinc-50 text-zinc-400"}`}>
                          {product.category}
                        </span>
                        {product.category === 'camera' && product.resolution_tier && (
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest ml-1">{product.resolution_tier.replace('_', ' ')} Vision</span>
                        )}
                        {product.category === 'recorder' && product.channels && (
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest ml-1">{product.channels} Port Node</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner ${TECH_COLORS[product.technology] || "bg-zinc-50 text-zinc-400 border-zinc-200"}`}>
                        {product.technology} Logic
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-zinc-900 dark:text-white text-base">₹{product.unit_price.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-1">Value / Unit</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/10 shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-400 dark:text-zinc-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100 dark:border-zinc-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          In-active
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-500/30 flex items-center justify-center transition-all shadow-inner active:scale-90"
                          title="Refine SKU"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => product.id && handleDelete(product.id, product.display_name)}
                          className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 flex items-center justify-center transition-all shadow-inner active:scale-90"
                          title="Dismantle"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSave={handleSave}
      />
    </>
  );
}

