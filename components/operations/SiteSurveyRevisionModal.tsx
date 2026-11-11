"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Layers, 
  Check, 
  Loader2, 
  X, 
  FileText, 
  Sparkles
} from "lucide-react";

interface SiteSurveyRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  parentQuoteId: string;
  currentVersion?: number;
  initialFlags?: {
    requiresLadderFee?: boolean;
    requiresMarbleSurcharge?: boolean;
    requiresMetalSurcharge?: boolean;
    requiresFurnishedSurcharge?: boolean;
    requiresHeavyDrillingSurcharge?: boolean;
  };
  selection?: any;
  onSuccess?: (newQuote: { id: string; version: number; total_payable: number }) => void;
}

export function SiteSurveyRevisionModal({
  isOpen,
  onClose,
  leadId,
  parentQuoteId,
  currentVersion = 1,
  initialFlags,
  selection,
  onSuccess
}: SiteSurveyRevisionModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  const [flags, setFlags] = useState({
    requiresLadderFee: !!initialFlags?.requiresLadderFee,
    requiresMarbleSurcharge: !!initialFlags?.requiresMarbleSurcharge,
    requiresMetalSurcharge: !!initialFlags?.requiresMetalSurcharge,
    requiresFurnishedSurcharge: !!initialFlags?.requiresFurnishedSurcharge,
    requiresHeavyDrillingSurcharge: !!initialFlags?.requiresHeavyDrillingSurcharge
  });

  if (!isOpen) return null;

  const nextVersion = currentVersion + 1;

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(flags).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        lead_id: leadId,
        parent_quote_id: parentQuoteId,
        revision_notes: revisionNotes || `Site conditions updated after physical inspection. Surcharges configured: ${activeCount} flags.`,
        site_surcharge_flags: flags,
        selection: selection || {
          plan_type: "recommended",
          technology: "HD",
          camera_count: 4,
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
        toast.success(t("ops_rev_ok", "Quotation v{v} created successfully! Total: ₹{total}", {
          v: String(nextVersion),
          total: String(data.data?.total_payable?.toLocaleString("en-IN") || "0"),
        }));
        if (onSuccess) {
          onSuccess(data.data);
        }
        onClose();
        router.refresh();
      } else {
        toast.error(extractErrorMessage(data, t("ops_rev_create_err", "Failed to create revised quotation")));
      }
    } catch (err: any) {
      console.error("Revision error:", err);
      toast.error(extractErrorMessage(err, t("ops_rev_net_err", "Network error while creating revision")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between gap-2 bg-muted/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{t("ops_rev_title", "Site Survey & Difficulty Checklist")}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {t("ops_ver_badge", "Version {v}", { v: String(nextVersion) })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("ops_rev_subtitle", "Observed site conditions will generate an immutable new version from Quote v{v}", { v: String(currentVersion) })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {t("ops_margin_title", "0% Margin Pass-Through Guarantee")}
            </p>
            <p className="mt-1 opacity-90 text-[11px] leading-relaxed">
              {t("ops_margin_desc", "As mandated by company business rules, site difficulty surcharges are billed to the customer at exact master rates with ₹0 margin markup and 100% disbursed to technician logistics.")}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("ops_phys_diff_lbl", "Physical Site Difficulties Observed:")}
            </label>

            {/* Flag 1: Ladder */}
            <div 
              onClick={() => toggleFlag("requiresLadderFee")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                flags.requiresLadderFee 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-muted/20 border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                flags.requiresLadderFee ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
              }`}>
                {flags.requiresLadderFee && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t("ops_flag_ladder_t", "High Ceiling / Scaffolding Needed")}</span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{t("ops_flag_ladder_b", "Ladder Fee")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ops_flag_ladder_d", "Mounting height is >12ft (high / very high). Requires technician to transport 15ft–20ft heavy ladder or scaffold.")}
                </p>
              </div>
            </div>

            {/* Flag 2: Marble */}
            <div 
              onClick={() => toggleFlag("requiresMarbleSurcharge")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                flags.requiresMarbleSurcharge 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-muted/20 border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                flags.requiresMarbleSurcharge ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
              }`}>
                {flags.requiresMarbleSurcharge && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t("ops_flag_marble_t", "Marble, Granite or Italian Tile Drilling")}</span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{t("ops_flag_marble_b", "Specialized Drill")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ops_flag_marble_d", "Delicate luxury stone requiring diamond-tipped core drill bits and water cooling to avoid cracking tiles.")}
                </p>
              </div>
            </div>

            {/* Flag 3: Metal */}
            <div 
              onClick={() => toggleFlag("requiresMetalSurcharge")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                flags.requiresMetalSurcharge 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-muted/20 border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                flags.requiresMetalSurcharge ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
              }`}>
                {flags.requiresMetalSurcharge && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t("ops_flag_metal_t", "Metal Girder / Purlin / Pole Installation")}</span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{t("ops_flag_metal_b", "Metal Bit / Screws")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ops_flag_metal_d", "Industrial shed iron framing, metal warehouse poles, or corrugated sheets requiring cobalt bits and self-tapping screws.")}
                </p>
              </div>
            </div>

            {/* Flag 4: Furnished */}
            <div 
              onClick={() => toggleFlag("requiresFurnishedSurcharge")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                flags.requiresFurnishedSurcharge 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-muted/20 border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                flags.requiresFurnishedSurcharge ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
              }`}>
                {flags.requiresFurnishedSurcharge && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t("ops_flag_furn_t", "Furnished Residence / Cleanliness Premium")}</span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{t("ops_flag_furn_b", "Dust-Free Care")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ops_flag_furn_d", "Inhabited luxury home or office requiring drop-cloths over furniture, vacuum extraction during drilling, and zero-debris cleanup.")}
                </p>
              </div>
            </div>

            {/* Flag 5: Heavy Drilling */}
            <div 
              onClick={() => toggleFlag("requiresHeavyDrillingSurcharge")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                flags.requiresHeavyDrillingSurcharge 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-muted/20 border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                flags.requiresHeavyDrillingSurcharge ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
              }`}>
                {flags.requiresHeavyDrillingSurcharge && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t("ops_flag_heavy_t", "Heavy Concrete / Deep Wall Penetration")}</span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{t("ops_flag_heavy_b", "Heavy Rotary Bit")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ops_flag_heavy_d", "Drilling through reinforced RCC beams, stone foundations, or exterior perimeter walls thicker than 1.5 feet.")}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t("ops_notes_lbl", "Site Survey Inspection Notes")}
            </label>
            <textarea
              rows={3}
              value={revisionNotes}
              onChange={e => setRevisionNotes(e.target.value)}
              placeholder={t("ops_notes_ph", "e.g. Visited site today: customer approved camera positions; ladder required for main hallway high ceiling.")}
              className="w-full bg-background border border-border text-foreground rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-sm"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
            >
              {t("del_cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-normal"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  {t("ops_rev_generating", "Generating Version {v}...", { v: String(nextVersion) })}
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 shrink-0" />
                  {t("ops_rev_save_btn", "Save & Generate Quote v{v}", { v: String(nextVersion) })}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
