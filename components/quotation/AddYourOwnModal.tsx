"use client";

import { X, Search, Camera, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { Product } from "@/types";
import { useConfiguratorStore } from "@/store/configurator";

interface AddYourOwnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
  currentTechnology: string;
}

export function AddYourOwnModal({ isOpen, onClose, onSelect, currentTechnology }: AddYourOwnModalProps) {
  const { products } = useConfiguratorStore();
  const [searchTerm, setSearchTerm] = useState("");

  const cameraProducts = useMemo(() => {
    return products
      .filter((p) => p.category === "camera" && p.is_active)
      .filter((p) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
          p.display_name.toLowerCase().includes(s) ||
          (p.brand && p.brand.toLowerCase().includes(s)) ||
          (p.technical_name && p.technical_name.toLowerCase().includes(s))
        );
      });
  }, [products, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Add to Comparison</h2>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">Select a camera to add to your comparison table</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-100 shrink-0 bg-zinc-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cameras by name, brand, or specs..."
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-11 pr-4 py-3 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-50/30">
          {cameraProducts.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium text-sm">No cameras found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cameraProducts.map((p) => {
                const mp = p.resolution_mp ?? (p.technical_name?.toLowerCase().includes("5mp") ? 5 : p.technical_name?.toLowerCase().includes("4mp") ? 4 : 2);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id!);
                      onClose();
                    }}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-blue-50 flex items-center justify-center shrink-0 transition-colors">
                      <Camera className="w-6 h-6 text-zinc-400 group-hover:text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{p.brand}</span>
                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{mp}MP</span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 leading-tight mb-1 truncate">{p.display_name}</h3>
                      <p className="text-xs font-semibold text-emerald-600">₹{(p.unit_price || 0).toLocaleString()}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
