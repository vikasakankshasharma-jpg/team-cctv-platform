"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ListPlus, Tag, BadgeIndianRupee, Zap } from "lucide-react";
import type { Addon } from "@/types";

interface AddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  addon?: (Addon & { technical_name?: string }) | null;
  onSave: (data: any) => Promise<void>;
}

export function AddonModal({ isOpen, onClose, addon, onSave }: AddonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    technical_name: "",
    price: 0,
    is_active: true,
    unit_multiplier: "none" as "none" | "camera_count",
  });

  useEffect(() => {
    if (addon && isOpen) {
      setFormData({
        display_name: addon.display_name || "",
        technical_name: addon.technical_name || "",
        price: addon.price || 0,
        is_active: addon.is_active ?? true,
        unit_multiplier: addon.unit_multiplier || "none",
      });
    } else {
      setFormData({
        display_name: "",
        technical_name: "",
        price: 0,
        is_active: true,
        unit_multiplier: "none",
      });
    }
  }, [addon, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save addon:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900 animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-md animate-in zoom-in-95 fade-in duration-500">
        
        {/* Header Section */}
        <div className="p-10 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                <ListPlus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {addon ? "Refine Add-on" : "Create Add-on"}
                </h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Component Inventory Configuration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Display Name
              </label>
              <input
                required
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                placeholder="e.g. 1TB Surveillance HDD"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <BadgeIndianRupee className="w-3 h-3" /> Unit Price
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black">₹</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-6 py-4 text-white font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Calculation Logic
              </label>
              <select
                value={formData.unit_multiplier}
                onChange={(e) => setFormData({ ...formData, unit_multiplier: e.target.value as "none" | "camera_count" })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-inner"
              >
                <option value="none">Fixed / Flat Rate</option>
                <option value="camera_count">Dynamic / Per Camera</option>
              </select>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Internal Technical Ref (Optional)</label>
              <input
                type="text"
                value={formData.technical_name}
                onChange={(e) => setFormData({ ...formData, technical_name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3.5 text-zinc-300 font-medium placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                placeholder="e.g. WD10PURZ-Surveillance"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <div className="space-y-1">
              <p className="text-sm font-black text-white">Visible in Catalyst Wizard</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Controls if this add-on appears to customers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8 py-4 text-xs font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            >
              Retreat
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ListPlus className="w-4 h-4 group-hover:scale-125 transition-transform" />
              )}
              {addon ? "Update Manifest" : "Register Component"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
