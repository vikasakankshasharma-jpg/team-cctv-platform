"use client";

import React, { useState } from "react";
import { 
  X, 
  Check, 
  Layers, 
  Loader2, 
  ShieldCheck, 
  Video, 
  HardDrive, 
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface QuotationRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  parentQuoteId: string;
  currentVersion?: number;
  initialRequirements?: any;
  initialFlags?: any;
  onSuccess: (data: any) => void;
}

export function QuotationRevisionModal({
  isOpen,
  onClose,
  leadId,
  parentQuoteId,
  currentVersion = 1,
  initialRequirements,
  initialFlags,
  onSuccess
}: QuotationRevisionModalProps) {
  const { t } = useTranslation();
  const nextVersion = currentVersion + 1;

  const [cameraCount, setCameraCount] = useState<number>(initialRequirements?.camera_count || 4);
  const [technology, setTechnology] = useState<"HD" | "IP">(initialRequirements?.technology_preference === "IP" ? "IP" : "HD");
  const [recordingDays, setRecordingDays] = useState<number>(initialRequirements?.recording_days || 15);
  const [planType, setPlanType] = useState<"recommended" | "budget" | "premium">("recommended");
  const [revisionNotes, setRevisionNotes] = useState<string>("");

  const [flags, setFlags] = useState({
    requiresLadderFee: !!initialFlags?.requiresLadderFee,
    requiresMarbleSurcharge: !!initialFlags?.requiresMarbleSurcharge,
    requiresMetalSurcharge: !!initialFlags?.requiresMetalSurcharge,
    requiresFurnishedSurcharge: !!initialFlags?.requiresFurnishedSurcharge,
    requiresHeavyDrillingSurcharge: !!initialFlags?.requiresHeavyDrillingSurcharge
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      toast.error(t("adm_qm_rev_err_note", "Please enter a revision reason/note to track why this change was made."));
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        lead_id: leadId,
        parent_quote_id: parentQuoteId,
        revision_notes: revisionNotes.trim(),
        site_surcharge_flags: flags,
        selection: {
          plan_type: planType,
          technology,
          camera_count: Number(cameraCount),
          storage_days: Number(recordingDays),
          picture_quality: "good",
          selected_addons: []
        }
      };

      const res = await fetch("/api/admin/quotes/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          t("adm_qm_rev_ok", "Quotation Version {ver} created! Total: ₹{total}", {
            ver: String(nextVersion),
            total: String(data.data?.total_payable?.toLocaleString("en-IN") || 0)
          })
        );
        onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.message || data.error || t("adm_qm_rev_err", "Failed to create revised quotation"));
      }
    } catch (err: any) {
      console.error("Revision error:", err);
      toast.error(err.message || t("adm_qm_rev_net_err", "Network error while creating revision"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">
                  {t("adm_qm_rev_title", "Create Quotation Revision")}
                </h2>
                <Badge className="bg-indigo-600 text-white font-bold text-[10px] whitespace-normal leading-snug shrink-0">
                  {t("adm_qm_rev_ver", "Version {ver}", { ver: String(nextVersion) })}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {t("adm_qm_rev_sub", "Deriving immutable new version from Quote v{ver}", { ver: String(currentVersion) })}
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
          
          {/* Audit Notice */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200">
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
              <span>{t("adm_qm_rev_aud_t", "Immutable Version Tracking")}</span>
            </p>
            <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
              {t("adm_qm_rev_aud_d", "Completed and booked quotes are protected. This will not overwrite the previous baseline v{prev}; it creates a new Version {next} with a permanent change audit trail.", {
                prev: String(currentVersion),
                next: String(nextVersion)
              })}
            </p>
          </div>

          {/* Mandatory Revision Notes */}
          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1">
              {t("adm_qm_rev_reason_lbl", "Revision Reason / What Changed * (Mandatory for Audit Trail):")}
            </label>
            <Input
              type="text"
              required
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder={t("adm_qm_rev_reason_ph", "e.g. Added 2 outdoor cameras and 30m extra cabling after site survey")}
              className="h-10 text-xs font-medium"
            />
          </div>

          {/* Camera Count & Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1.5">
                {t("adm_qm_rev_cam_cnt", "Cameras Count:")}
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
                {t("adm_qm_comp_tech_lbl", "Camera Technology:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={technology === "HD" ? "default" : "outline"}
                  onClick={() => setTechnology("HD")}
                  className={`min-h-[2.5rem] h-auto py-2 px-2 text-xs font-bold whitespace-normal leading-snug ${technology === "HD" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                >
                  {t("adm_qm_rev_hd", "HD (Analog)")}
                </Button>
                <Button
                  type="button"
                  variant={technology === "IP" ? "default" : "outline"}
                  onClick={() => setTechnology("IP")}
                  className={`min-h-[2.5rem] h-auto py-2 px-2 text-xs font-bold whitespace-normal leading-snug ${technology === "IP" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                >
                  {t("adm_qm_rev_ip", "IP (Digital)")}
                </Button>
              </div>
            </div>
          </div>

          {/* Recording Days */}
          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1.5">
              {t("adm_qm_rev_rec", "Recording Days / HDD Sizing:")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 15, 30].map((days) => (
                <Button
                  key={days}
                  type="button"
                  variant={recordingDays === days ? "default" : "outline"}
                  onClick={() => setRecordingDays(days)}
                  className="min-h-[2.25rem] h-auto py-1.5 px-2 text-xs font-bold whitespace-normal leading-snug"
                >
                  {t("adm_qm_days_suffix", "{days} Days", { days: String(days) })}
                </Button>
              ))}
            </div>
          </div>

          {/* Site Conditions & Difficulties */}
          <div className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
              {t("adm_qm_rev_flags_lbl", "Physical Site Difficulties Observed (0% Margin Surcharges):")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <label 
                onClick={() => toggleFlag("requiresLadderFee")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresLadderFee ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresLadderFee} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border ${flags.requiresLadderFee ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresLadderFee && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="leading-snug">{t("adm_qm_flag_ladder", "Ladder / High Ceiling (>12ft)")}</span>
              </label>

              <label 
                onClick={() => toggleFlag("requiresMarbleSurcharge")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresMarbleSurcharge ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresMarbleSurcharge} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border ${flags.requiresMarbleSurcharge ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresMarbleSurcharge && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="leading-snug">{t("adm_qm_flag_marble", "Marble / Italian Core Drill")}</span>
              </label>

              <label 
                onClick={() => toggleFlag("requiresFurnishedSurcharge")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresFurnishedSurcharge ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresFurnishedSurcharge} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border ${flags.requiresFurnishedSurcharge ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresFurnishedSurcharge && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="leading-snug">{t("adm_qm_flag_concealed", "Concealed Interior Routing")}</span>
              </label>

              <label 
                onClick={() => toggleFlag("requiresHeavyDrillingSurcharge")}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  flags.requiresHeavyDrillingSurcharge ? "bg-primary/5 border-primary font-bold text-primary" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <input type="checkbox" checked={flags.requiresHeavyDrillingSurcharge} onChange={() => {}} className="hidden" />
                <div className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border ${flags.requiresHeavyDrillingSurcharge ? "bg-primary border-primary text-white" : "border-zinc-400"}`}>
                  {flags.requiresHeavyDrillingSurcharge && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="leading-snug">{t("adm_qm_flag_heavy", "Heavy Concrete Core Cutting")}</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[2.25rem] h-auto py-2 text-xs font-semibold whitespace-normal leading-snug"
            >
              {t("adm_qm_del_cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-[2.25rem] h-auto py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 px-5 whitespace-normal leading-snug"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  <span>{t("adm_qm_rev_gen", "Generating Version {ver}...", { ver: String(nextVersion) })}</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("adm_qm_rev_save", "Save as Version {ver}", { ver: String(nextVersion) })}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
