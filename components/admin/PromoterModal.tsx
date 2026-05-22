"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Dices, UserPlus, Fingerprint, ShieldCheck, Settings2 } from "lucide-react";
import type { Promoter } from "@/types";

interface PromoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoter?: Promoter | null;
  onSave: (data: any) => Promise<void>;
  availableLayouts?: { id: string; name: string }[];
}

export function PromoterModal({ isOpen, onClose, promoter, onSave, availableLayouts = [] }: PromoterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    referral_code: "",
    is_active: true,
    discount_type: "percent" as "flat" | "percent",
    discount_value: 0,
    custom_layout_id: "" as string,
  });

  useEffect(() => {
    if (promoter && isOpen) {
      setFormData({
        name: promoter.name,
        email: promoter.email || "",
        mobile_number: promoter.mobile_number || "",
        referral_code: promoter.referral_code,
        is_active: promoter.is_active ?? true,
        discount_type: promoter.discount_type || "percent",
        discount_value: promoter.discount_value || 0,
        custom_layout_id: promoter.custom_layout_id || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        mobile_number: "",
        referral_code: "",
        is_active: true,
        discount_type: "percent",
        discount_value: 0,
        custom_layout_id: "",
      });
    }
  }, [promoter, isOpen]);

  if (!isOpen) return null;

  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "TEAM";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, referral_code: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Ensure code is uppercase and stripped of spaces
    const finalData = {
        ...formData,
        referral_code: formData.referral_code.toUpperCase().replace(/\s+/g, ""),
        custom_layout_id: formData.custom_layout_id === "" ? null : formData.custom_layout_id
    };

    try {
      await onSave(finalData);
      onClose();
    } catch (error) {
      console.error("Failed to save promoter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900 animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-md animate-in zoom-in-95 fade-in duration-500">
        
        {/* Header Section */}
        <div className="p-10 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {promoter ? "Refine Agent" : "Onboard Agent"}
                </h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Partnership & Referral Identity</p>
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
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-amber-500" /> Professional Identity
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-inner"
                  placeholder="Rahul Sharma"
                />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-inner"
                  placeholder="rahul@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-amber-500" /> Direct Mobile
              </label>
              <input
                required
                type="text"
                maxLength={10}
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, "") })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-inner"
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Fingerprint className="w-3 h-3 text-amber-500" /> Referral Cryptogram
              </label>
              <div className="flex gap-3">
                <input
                  required
                  type="text"
                  disabled={!!promoter}
                  value={formData.referral_code}
                  onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-inner disabled:opacity-50 text-center"
                  placeholder="TEAMXXXX"
                />
                {!promoter && (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="w-16 h-16 shrink-0 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-2xl flex items-center justify-center transition-all border border-zinc-700/50 hover:border-amber-500/30 active:scale-90"
                    title="Generate Seed Code"
                  >
                    <Dices className="w-6 h-6 animate-pulse" />
                  </button>
                )}
              </div>
              {promoter && <p className="text-[10px] font-bold text-amber-500/50 uppercase tracking-widest text-center mt-2 italic flex items-center justify-center gap-2"><Fingerprint className="w-3 h-3" /> Immutable Ledger Entry</p>}
            </div>

            {/* Discount Configuration */}
            <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
               <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Client Benefit (Discount)</p>
                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                     <button 
                       type="button"
                       onClick={() => setFormData({...formData, discount_type: "percent"})}
                       className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.discount_type === "percent" ? "bg-amber-600 text-white" : "text-zinc-500 hover:text-white"}`}
                     >
                       Percent
                     </button>
                     <button 
                       type="button"
                       onClick={() => setFormData({...formData, discount_type: "flat"})}
                       className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.discount_type === "flat" ? "bg-amber-600 text-white" : "text-zinc-500 hover:text-white"}`}
                     >
                       Flat
                     </button>
                  </div>
               </div>
               <div className="relative">
                  <input
                    required
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3.5 text-white font-black text-lg focus:outline-none focus:border-amber-500 transition-all shadow-inner pl-10"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                    {formData.discount_type === "percent" ? "%" : "₹"}
                  </span>
               </div>
            </div>

            {/* Custom Layout Override */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Settings2 className="w-3 h-3 text-amber-500" /> Custom Layout Override
              </label>
              <select
                value={formData.custom_layout_id}
                onChange={(e) => setFormData({ ...formData, custom_layout_id: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-inner appearance-none"
              >
                <option value="">Default System Layout</option>
                {availableLayouts.map(layout => (
                  <option key={layout.id} value={layout.id}>{layout.name}</option>
                ))}
              </select>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Override the comparison cards displayed when leads use this code</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <div className="space-y-1">
              <p className="text-sm font-black text-white">Authorization Status</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enables or suspends agent commission tracking</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-white transition-all"></div>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8 py-4 text-xs font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center gap-3 bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 group-hover:scale-125 transition-transform" />
              )}
              {promoter ? "Commit Changes" : "Authorise Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
