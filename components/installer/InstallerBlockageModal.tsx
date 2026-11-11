"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { reportInstallerBlockage } from "@/app/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export function InstallerBlockageModal({ 
  isOpen, 
  onClose, 
  jobId, 
  leadId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  jobId: string;
  leadId: string;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t("inst_blk_sel_err", "Please select a blockage reason"));
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await reportInstallerBlockage(jobId, leadId, reason, notes);
      if (res.success) {
        toast.success(t("inst_blk_ok", "Blockage reported successfully"));
        onClose();
        router.push("/installer/dashboard");
      } else {
        toast.error(res.error || t("inst_blk_err", "Failed to report blockage"));
      }
    } catch (error) {
      toast.error(t("del_err_generic", "An error occurred"));
    } finally {
      setSubmitting(false);
    }
  };

  const REASONS = [
    { value: "Customer Not Home", key: "inst_blk_r_not_home" as const },
    { value: "Missing Parts / Hardware", key: "inst_blk_r_parts" as const },
    { value: "Site Not Ready / Under Construction", key: "inst_blk_r_site" as const },
    { value: "Customer Refused Installation", key: "inst_blk_r_refused" as const },
    { value: "Other", key: "inst_blk_r_other" as const }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="bg-red-500/10 p-6 flex items-start justify-between border-b border-red-500/20">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="font-black text-lg">{t("inst_blk_title", "Report Blockage")}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-red-500/10 text-red-600 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground font-medium">
            {t("inst_blk_desc", "Reporting a blockage will pause this job and alert the dispatch team to reschedule or resolve the issue.")}
          </p>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t("inst_blk_reason_lbl", "Primary Reason")}</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === r.value ? 'border-red-500 bg-red-500/5' : 'border-input hover:bg-muted/50'}`}>
                  <input 
                    type="radio" 
                    name="reason" 
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-red-600 shrink-0"
                  />
                  <span className={`text-sm font-semibold ${reason === r.value ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>{t(r.key, r.value)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t("inst_blk_notes_lbl", "Additional Notes")}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("inst_blk_notes_ph", "Provide any additional context for the dispatch team...")}
              className="w-full p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !reason}
              className="w-full min-h-14 h-auto py-4 px-4 whitespace-normal bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              {submitting ? t("inst_blk_reporting", "Reporting...") : t("inst_blk_confirm", "Confirm Blockage")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
