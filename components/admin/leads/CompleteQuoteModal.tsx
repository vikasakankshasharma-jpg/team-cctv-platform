"use client";

import React, { useState } from "react";
import { 
  X, 
  Check, 
  Zap, 
  Loader2, 
  ShieldAlert, 
  Video, 
  HardDrive, 
  Tag, 
  Percent, 
  Sparkles,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CompleteQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  quoteId: string;
  customerName: string;
  customerMobile: string;
  initialRequirement?: any;
  onSuccess: (data: any) => void;
}

export function CompleteQuoteModal({
  isOpen,
  onClose,
  leadId,
  quoteId,
  customerName,
  customerMobile,
  initialRequirement,
  onSuccess
}: CompleteQuoteModalProps) {
  const [cameraCount, setCameraCount] = useState<number>(initialRequirement?.camera_count || 4);
  const [technology, setTechnology] = useState<"HD" | "IP">(initialRequirement?.technology_preference === "IP" ? "IP" : "HD");
  const [recordingDays, setRecordingDays] = useState<number>(initialRequirement?.recording_days || 15);
  const [planType, setPlanType] = useState<"recommended" | "budget" | "premium">("recommended");
  const [brandPreference, setBrandPreference] = useState<string>("Mixed (Best Price)");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const [flags, setFlags] = useState({
    requiresLadderFee: false,
    requiresMarbleSurcharge: false,
    requiresMetalSurcharge: false,
    requiresFurnishedSurcharge: false,
    requiresHeavyDrillingSurcharge: false
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        quoteId,
        leadId,
        camera_count: Number(cameraCount),
        technology,
        recording_days: Number(recordingDays),
        plan_type: planType,
        brand_preference: brandPreference,
        site_surcharge_flags: flags,
        discount_amount: Number(discountAmount) || 0,
        notes: notes || `Quotation completed by admin for ${customerName}`
      };

      const res = await fetch("/api/admin/quotes/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Quotation completed! Total Payable: ₹${data.total_payable?.toLocaleString("en-IN")}`);
        onSuccess(data);
        onClose();
      } else {
        toast.error(data.message || data.error || "Failed to complete quotation");
      }
    } catch (err: any) {
      console.error("Complete quote error:", err);
      toast.error(err.message || "Network error while completing quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Complete & Finalize Quotation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customerName} • {customerMobile || "No Mobile"} • ID: {quoteId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Instant Server Pricing Authority
            </p>
            <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
              Completing this quotation will calculate the full Bill of Materials (BOM), SMPS power supply, cables, and storage, and advance status to <strong>Quote Sent</strong>.
            </p>
          </div>

          {/* Camera Count & Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1.5">
                Camera Units Count:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="64"
                  value={cameraCount}
                  onChange={(e) => setCameraCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="font-black text-sm h-10"
                />
                <div className="flex gap-1">
                  {[2, 4, 8, 16].map((cnt) => (
                    <Button
                      key={cnt}
                      type="button"
                      size="sm"
                      variant={cameraCount === cnt ? "default" : "outline"}
                      onClick={() => setCameraCount(cnt)}
                      className="h-10 px-2.5 text-xs font-bold"
                    >
                      {cnt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1.5">
                Technology Tier:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={technology === "HD" ? "default" : "outline"}
                  onClick={() => setTechnology("HD")}
                  className={`h-10 text-xs font-bold ${technology === "HD" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                >
                  HD (Analog / Coax)
                </Button>
                <Button
                  type="button"
                  variant={technology === "IP" ? "default" : "outline"}
                  onClick={() => setTechnology("IP")}
                  className={`h-10 text-xs font-bold ${technology === "IP" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                >
                  IP (Digital / PoE)
                </Button>
              </div>
            </div>
          </div>

          {/* Storage & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1.5">
                Recording Days (Surveillance HDD):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 15, 30].map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={recordingDays === days ? "default" : "outline"}
                    onClick={() => setRecordingDays(days)}
                    className="h-9 text-xs font-bold"
                  >
                    {days} Days
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1.5">
                Brand Preference:
              </label>
              <select
                value={brandPreference}
                onChange={(e) => setBrandPreference(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Mixed (Best Price)">Mixed (Best Price - Recommended)</option>
                <option value="CP Plus">CP Plus (Orange Line)</option>
                <option value="Hikvision">Hikvision (Enterprise)</option>
                <option value="Dahua">Dahua (Commercial)</option>
              </select>
            </div>
          </div>

          {/* Site Conditions & Difficulties */}
          <div className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
              Site Difficulty Flags (0% Margin Surcharges):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <label 
                onClick={() => toggleFlag("requiresLadderFee")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresLadderFee ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresLadderFee} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${flags.requiresLadderFee ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresLadderFee && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Ladder / High Ceiling (&gt;12ft)</span>
              </label>

              <label 
                onClick={() => toggleFlag("requiresMarbleSurcharge")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresMarbleSurcharge ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresMarbleSurcharge} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${flags.requiresMarbleSurcharge ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresMarbleSurcharge && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Marble / Italian Core Drill</span>
              </label>

              <label 
                onClick={() => toggleFlag("requiresFurnishedSurcharge")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresFurnishedSurcharge ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresFurnishedSurcharge} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${flags.requiresFurnishedSurcharge ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresFurnishedSurcharge && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Concealed Interior Routing</span>
              </label>

              <label 
                onClick={() => toggleFlag("requiresHeavyDrillingSurcharge")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresHeavyDrillingSurcharge ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresHeavyDrillingSurcharge} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${flags.requiresHeavyDrillingSurcharge ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresHeavyDrillingSurcharge && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Heavy Concrete Core Cutting</span>
              </label>
            </div>
          </div>

          {/* Commercial Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1">
                Special Commercial Discount (₹ Flat):
              </label>
              <Input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="h-9 font-semibold text-xs"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1">
                Admin Notes:
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Discussed with client on call"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating & Saving...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Finalize & Complete Quotation</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
