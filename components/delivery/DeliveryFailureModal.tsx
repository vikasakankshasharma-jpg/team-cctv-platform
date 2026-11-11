"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { reportDeliveryFailure } from "@/app/actions/dispatch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export function DeliveryFailureModal({ 
  isOpen, 
  onClose, 
  quoteId, 
  leadId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  quoteId: string;
  leadId: string;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t("del_fail_sel_err", "Please select a failure reason"));
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await reportDeliveryFailure(quoteId, leadId, reason);
      if (res.success) {
        toast.success(t("del_fail_ok", "Delivery marked as failed"));
        onClose();
        router.push("/delivery/route");
      } else {
        toast.error(res.error || t("del_fail_err", "Failed to update delivery"));
      }
    } catch (error) {
      toast.error(t("del_err_generic", "An error occurred"));
    } finally {
      setSubmitting(false);
    }
  };

  const REASONS = [
    { value: "Customer Refused Package", label: t("del_fail_r_refused", "Customer Refused Package") },
    { value: "Customer Not Available", label: t("del_fail_r_unavail", "Customer Not Available") },
    { value: "Address Not Found / Incorrect", label: t("del_fail_r_address", "Address Not Found / Incorrect") },
    { value: "Could Not Collect Cash / Payment Failed", label: t("del_fail_r_payment", "Could Not Collect Cash / Payment Failed") },
    { value: "Package Damaged", label: t("del_fail_r_damaged", "Package Damaged") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-red-50 p-6 flex items-start justify-between border-b border-red-100">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="font-black text-lg">{t("del_fail_title", "Report Delivery Failure")}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <p className="text-sm text-zinc-500 font-medium">
            {t("del_fail_desc", "This will mark the delivery as failed and instruct you to return the hardware to the hub.")}
          </p>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{t("del_fail_reason_lbl", "Primary Reason")}</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === r.value ? 'border-red-500 bg-red-50' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                  <input 
                    type="radio" 
                    name="reason" 
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-red-600 shrink-0"
                  />
                  <span className={`text-sm font-semibold ${reason === r.value ? 'text-red-700' : 'text-zinc-700'}`}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !reason}
              className="w-full py-4 px-4 bg-red-600 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50 whitespace-normal text-center"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              {submitting ? t("del_fail_submitting", "Reporting...") : t("del_fail_submit", "Confirm Return to Hub")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
