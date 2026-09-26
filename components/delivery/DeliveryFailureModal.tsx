"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { reportDeliveryFailure } from "@/app/actions/dispatch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a failure reason");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await reportDeliveryFailure(quoteId, leadId, reason);
      if (res.success) {
        toast.success("Delivery marked as failed");
        onClose();
        router.push("/delivery/route");
      } else {
        toast.error(res.error || "Failed to update delivery");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const REASONS = [
    "Customer Refused Package",
    "Customer Not Available",
    "Address Not Found / Incorrect",
    "Could Not Collect Cash / Payment Failed",
    "Package Damaged"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-red-50 p-6 flex items-start justify-between border-b border-red-100">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-black text-lg">Report Delivery Failure</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <p className="text-sm text-zinc-500 font-medium">
            This will mark the delivery as failed and instruct you to return the hardware to the hub.
          </p>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Primary Reason</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === r ? 'border-red-500 bg-red-50' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                  <input 
                    type="radio" 
                    name="reason" 
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-red-600"
                  />
                  <span className={`text-sm font-semibold ${reason === r ? 'text-red-700' : 'text-zinc-700'}`}>{r}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !reason}
              className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
              {submitting ? "Reporting..." : "Confirm Return to Hub"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
