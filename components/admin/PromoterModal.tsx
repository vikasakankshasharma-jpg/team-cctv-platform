"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Loader2, 
  UserPlus, 
  Fingerprint, 
  ShieldCheck, 
  Settings2, 
  QrCode, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  Percent, 
  Coins, 
  Megaphone,
  RefreshCw
} from "lucide-react";
import type { Promoter, PartnerType, PreprintedToken } from "@/types";
import { getNextSequentialReferralCode, getUnassignedTokens } from "@/app/actions/promoters";
import { toast } from "sonner";

interface PromoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoter?: Promoter | null;
  onSave: (data: any) => Promise<void>;
  availableLayouts?: { id: string; name: string }[];
}

export function PromoterModal({ isOpen, onClose, promoter, onSave, availableLayouts = [] }: PromoterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSequential, setLoadingSequential] = useState(false);

  // Pre-printed batch state
  const [codeMode, setCodeMode] = useState<"sequential" | "custom">("sequential");
  const [batchInfo, setBatchInfo] = useState<{
    isPreprinted: boolean;
    remainingUnassigned: number;
    batchId?: string;
  }>({ isPreprinted: false, remainingUnassigned: 0 });
  const [unassignedList, setUnassignedList] = useState<PreprintedToken[]>([]);
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    referral_code: "",
    is_active: true,
    partner_type: "percent" as PartnerType,
    promoter_incentive_type: "percent" as "percent" | "flat",
    promoter_incentive_value: 3,
    discount_type: "percent" as "percent" | "flat",
    discount_value: 3,
    min_order_value: 0,
    custom_layout_id: "" as string,
    batch_id: "" as string,
  });

  // Fetch next sequential code when opening modal for a new agent
  useEffect(() => {
    if (isOpen && !promoter) {
      loadNextSequentialCode();
    }
  }, [isOpen, promoter]);

  const loadNextSequentialCode = async () => {
    setLoadingSequential(true);
    try {
      const res = await getNextSequentialReferralCode();
      setFormData(prev => ({
        ...prev,
        referral_code: res.code,
        batch_id: res.batchId || "",
      }));
      setBatchInfo({
        isPreprinted: res.isPreprinted,
        remainingUnassigned: res.remainingUnassigned,
        batchId: res.batchId,
      });

      // Also pre-fetch unassigned tokens for dropdown picker
      const tokens = await getUnassignedTokens(30);
      setUnassignedList(tokens);
    } catch (err) {
      console.error("Failed to fetch next sequential code:", err);
    } finally {
      setLoadingSequential(false);
    }
  };

  useEffect(() => {
    if (promoter && isOpen) {
      const partnerType = promoter.partner_type || (promoter.discount_type === "flat" ? "flat" : "percent");
      setFormData({
        name: promoter.name || "",
        email: promoter.email || "",
        mobile_number: promoter.mobile_number || "",
        referral_code: promoter.referral_code || "",
        is_active: promoter.is_active ?? true,
        partner_type: partnerType,
        promoter_incentive_type: promoter.promoter_incentive_type || (partnerType === "flat" ? "flat" : "percent"),
        promoter_incentive_value: promoter.promoter_incentive_value ?? (promoter.discount_value || 0),
        discount_type: promoter.discount_type || (partnerType === "flat" ? "flat" : "percent"),
        discount_value: promoter.discount_value || 0,
        min_order_value: promoter.min_order_value || 0,
        custom_layout_id: promoter.custom_layout_id || "",
        batch_id: promoter.batch_id || "",
      });
      setCodeMode("custom"); // When editing, show direct code
    } else if (!promoter && isOpen) {
      setFormData({
        name: "",
        email: "",
        mobile_number: "",
        referral_code: "",
        is_active: true,
        partner_type: "percent",
        promoter_incentive_type: "percent",
        promoter_incentive_value: 3,
        discount_type: "percent",
        discount_value: 3,
        min_order_value: 0,
        custom_layout_id: "",
        batch_id: "",
      });
      setCodeMode("sequential");
    }
  }, [promoter, isOpen]);

  if (!isOpen) return null;

  const handlePartnerTypeChange = (type: PartnerType) => {
    if (type === "percent") {
      setFormData(prev => ({
        ...prev,
        partner_type: "percent",
        promoter_incentive_type: "percent",
        promoter_incentive_value: prev.promoter_incentive_value || 3,
        discount_type: "percent",
        discount_value: prev.discount_value || 3,
        min_order_value: 0,
      }));
    } else if (type === "flat") {
      setFormData(prev => ({
        ...prev,
        partner_type: "flat",
        promoter_incentive_type: "flat",
        promoter_incentive_value: prev.promoter_incentive_value && prev.promoter_incentive_value > 100 ? prev.promoter_incentive_value : 500,
        discount_type: "flat",
        discount_value: prev.discount_value && prev.discount_value > 100 ? prev.discount_value : 500,
        min_order_value: prev.min_order_value || 10000,
      }));
    } else {
      // Campaign / situational
      setFormData(prev => ({
        ...prev,
        partner_type: "campaign",
      }));
    }
  };

  const handleSelectToken = (token: PreprintedToken) => {
    setFormData(prev => ({
      ...prev,
      referral_code: token.code,
      batch_id: token.batch_id,
    }));
    setShowTokenPicker(false);
    toast.success(`Selected card ${token.code}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter promoter name");
      return;
    }
    if (!formData.referral_code.trim()) {
      toast.error("Referral code is required");
      return;
    }

    setIsSubmitting(true);

    const finalData = {
      ...formData,
      referral_code: formData.referral_code.toUpperCase().replace(/\s+/g, ""),
      custom_layout_id: formData.custom_layout_id === "" ? null : formData.custom_layout_id,
      promoter_incentive_value: Number(formData.promoter_incentive_value) || 0,
      discount_value: Number(formData.discount_value) || 0,
      min_order_value: Number(formData.min_order_value) || 0,
    };

    try {
      await onSave(finalData);
      toast.success(promoter ? "Partner updated successfully" : `Agent onboarded with code ${finalData.referral_code}`);
      onClose();
    } catch (error: any) {
      console.error("Failed to save promoter:", error);
      toast.error(error.message || "Failed to save promoter");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300 my-8">
        
        {/* Header Section */}
        <div className="p-6 md:p-8 pb-5 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner border border-amber-500/20">
                <UserPlus className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {promoter ? "Refine Agent" : "Onboard Agent"}
                </h2>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  Partnership & Referral Identity
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-700/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
          
          {/* 1. PROFESSIONAL IDENTITY */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Professional Identity
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-5 py-3.5 text-white font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                placeholder="Partner Name (e.g. Vikas Sharma)"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-5 py-3.5 text-white font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                placeholder="partner@example.com (optional)"
              />
            </div>
            <input
              required
              type="text"
              maxLength={10}
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, "") })}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-5 py-3.5 text-white font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
              placeholder="10-digit mobile number for OTP & commission WhatsApp alerts"
            />
          </div>

          {/* 2. REFERRAL CODE ASSIGNMENT (BULK PRE-PRINT AWARE) */}
          <div className="p-5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Referral Code & QR Assignment
                </span>
              </div>

              {!promoter && (
                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setCodeMode("sequential")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${codeMode === "sequential" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    Pre-Printed Bulk Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeMode("custom")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${codeMode === "custom" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    Custom Campaign
                  </button>
                </div>
              )}
            </div>

            {/* Code Input & Pickers */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    required
                    type="text"
                    disabled={!!promoter || (codeMode === "sequential" && !showTokenPicker)}
                    value={formData.referral_code}
                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-white font-mono font-black text-lg tracking-[0.2em] focus:outline-none focus:border-amber-500 transition-all text-center disabled:opacity-90"
                    placeholder="TEAM-1001"
                  />
                  {loadingSequential && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    </div>
                  )}
                </div>

                {!promoter && codeMode === "sequential" && (
                  <>
                    <button
                      type="button"
                      onClick={loadNextSequentialCode}
                      className="h-12 w-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl flex items-center justify-center border border-zinc-700/40 transition-all active:scale-95 shrink-0"
                      title="Refresh next code"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingSequential ? "animate-spin" : ""}`} />
                    </button>
                    {unassignedList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowTokenPicker(!showTokenPicker)}
                        className="h-12 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-2xl flex items-center gap-1.5 border border-zinc-700/40 text-xs font-bold transition-all active:scale-95 shrink-0"
                        title="Pick specific card from deck"
                      >
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">Pick Card</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Status helper info */}
              {!promoter && (
                <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-1">
                  {batchInfo.isPreprinted ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pre-printed card ready to hand over ({batchInfo.remainingUnassigned} unassigned in stock)
                    </span>
                  ) : codeMode === "sequential" ? (
                    <span className="text-amber-400/90 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Calculated next sequential code. (No bulk batches in stock; generate batch to print cards in bulk)
                    </span>
                  ) : (
                    <span className="text-zinc-400">
                      Enter unique custom slug for advertising, hoardings, or social media campaigns.
                    </span>
                  )}
                </div>
              )}

              {/* Unassigned card selector dropdown deck */}
              {showTokenPicker && unassignedList.length > 0 && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2 animate-in fade-in">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Select the exact card in your hand:
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                    {unassignedList.map((token) => (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => handleSelectToken(token)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all text-center ${
                          formData.referral_code === token.code
                            ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-sm"
                            : "bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-amber-500/50"
                        }`}
                      >
                        {token.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. PARTNERSHIP MODEL & INCENTIVES (THE 3 TYPES) */}
          <div className="p-5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-5">
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Partnership Incentive & Customer Discount
              </p>
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handlePartnerTypeChange("percent")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.partner_type === "percent"
                      ? "bg-amber-500/10 border-amber-500/50 text-white shadow-inner"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-xs uppercase tracking-wider">Type 1: Percentage</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    % Incentive to partner & % discount to customer
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePartnerTypeChange("flat")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.partner_type === "flat"
                      ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-inner"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-xs uppercase tracking-wider">Type 2: Flat Reward</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Flat ₹ reward & flat ₹ discount on min purchase
                  </p>
                </button>
              </div>
            </div>

            {/* Inputs based on Model */}
            {formData.partner_type === "percent" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Promoter Incentive (%)
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={formData.promoter_incentive_value}
                      onChange={(e) => setFormData({ ...formData, promoter_incentive_value: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-base focus:outline-none focus:border-amber-500 transition-all pl-10"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Earned on ex-tax contract value</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Customer Benefit / Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-base focus:outline-none focus:border-amber-500 transition-all pl-10"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Deducted from customer total quote</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Promoter Flat Incentive (₹)
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="number"
                        step="50"
                        min="0"
                        value={formData.promoter_incentive_value}
                        onChange={(e) => setFormData({ ...formData, promoter_incentive_value: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-base focus:outline-none focus:border-emerald-500 transition-all pl-10"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Fixed reward per closed deal</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Customer Flat Discount (₹)
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="number"
                        step="50"
                        min="0"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-base focus:outline-none focus:border-emerald-500 transition-all pl-10"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Flat reduction for customer</p>
                  </div>
                </div>

                <div className="space-y-1.5 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Minimum Order Value Required for Discount
                    </label>
                    <span className="text-xs font-bold text-emerald-400">
                      ₹{formData.min_order_value.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="500"
                      min="0"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all pl-10"
                      placeholder="e.g. 10000"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Customer only unlocks flat ₹{formData.discount_value} discount if total quotation is at least this amount.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. CUSTOM LAYOUT OVERRIDE */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5 text-amber-500" /> Custom Layout Override
            </label>
            <select
              value={formData.custom_layout_id}
              onChange={(e) => setFormData({ ...formData, custom_layout_id: e.target.value })}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-5 py-3.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm appearance-none"
            >
              <option value="">Default System Layout</option>
              {availableLayouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Override the comparison cards displayed when leads use this code
            </p>
          </div>

          {/* 5. AUTHORIZATION STATUS */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800">
            <div className="space-y-0.5">
              <p className="text-sm font-black text-white">Authorization Status</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Enables or suspends agent commission & lead tracking
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-white transition-all"></div>
            </label>
          </div>

          {/* 6. MODAL ACTIONS */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3.5 text-xs font-black text-zinc-400 hover:text-white uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <UserPlus className="w-4 h-4 text-zinc-950 group-hover:scale-110 transition-transform" />
              )}
              {promoter ? "Commit Changes" : "Authorise Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
