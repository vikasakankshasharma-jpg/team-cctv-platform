"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RefundDialogProps {
  quoteId: string;
  paymentId?: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function RefundDialog({ quoteId, paymentId, amount, onSuccess, onClose }: RefundDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          paymentId,
          amount,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");

      toast.success("Refund processed successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in p-6">
        <h3 className="text-xl font-bold text-white mb-2">Process Refund</h3>
        <p className="text-sm text-zinc-400 mb-6">
          You are about to refund ₹{amount.toLocaleString('en-IN')} for Quote ID: <span className="font-mono text-xs">{quoteId}</span>.
          This action cannot be undone.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Refund Reason (Required)</label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              rows={3}
              placeholder="e.g. Customer requested cancellation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          
          <div className="flex items-start gap-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-400 font-medium">
              Processing this refund will automatically cancel any pending jobs and restock hardware inventory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRefund}
            disabled={loading}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Process Refund
          </button>
        </div>
      </div>
    </div>
  );
}
