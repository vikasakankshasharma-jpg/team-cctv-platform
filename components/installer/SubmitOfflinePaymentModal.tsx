"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Banknote, 
  X, 
  Loader2, 
  IndianRupee, 
  QrCode, 
  ShieldAlert, 
  CheckCircle2, 
  Lock 
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { DynamicOnScreenQRCodeModal } from "@/components/shared/DynamicOnScreenQRCodeModal";

interface SubmitPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  quoteId: string;
  isCashApproved?: boolean;
  expectedAmount?: number;
}

interface PaymentFormData {
  amount: string;
  method: "qr_upi" | "upi" | "cash";
  utrNumber: string;
}

export default function SubmitOfflinePaymentModal({ 
  isOpen, 
  onClose, 
  leadId, 
  quoteId, 
  isCashApproved = false,
  expectedAmount = 0 
}: SubmitPaymentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCashApproval, setIsRequestingCashApproval] = useState(false);
  const [cashApprovalRequested, setCashApprovalRequested] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<PaymentFormData>({
    defaultValues: {
      method: "qr_upi",
      amount: expectedAmount > 0 ? String(expectedAmount) : "",
      utrNumber: ""
    }
  });

  const method = watch("method");
  const currentAmount = watch("amount");

  const handleRequestCashApproval = async () => {
    setIsRequestingCashApproval(true);
    try {
      const res = await fetch("/api/installer/cash-approval/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          quoteId,
          amount: Number(currentAmount) || expectedAmount || 0,
          reason: "Customer requested physical cash payment on site"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCashApprovalRequested(true);
        toast.success("Cash collection request sent to Admin desk!");
      } else {
        toast.error(data.error || "Failed to request cash approval");
      }
    } catch {
      toast.error("Network error requesting cash approval");
    } finally {
      setIsRequestingCashApproval(false);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (data.method === "qr_upi") {
      setIsQrModalOpen(true);
      return;
    }

    if (data.method === "cash" && !isCashApproved) {
      toast.error("Cash collection is locked. Admin staff approval is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/installer/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          quoteId,
          amount: Number(data.amount),
          method: data.method,
          utrNumber: data.method === "upi" ? data.utrNumber : undefined
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      if (result.status === "approved") {
        toast.success("Payment instantly approved (Trusted Collector)!");
      } else {
        toast.success("Payment submitted for Admin verification.");
      }
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white">Collect Payment On Site</h2>
                <p className="text-xs text-zinc-500">Quote #{quoteId.slice(0, 8)}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Select Payment Method
                </label>
                
                {/* Option 1: On-Screen Dynamic UPI QR (Default & Recommended) */}
                <label
                  onClick={() => setValue("method", "qr_upi")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    method === "qr_upi" 
                      ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-sm" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  <input type="radio" value="qr_upi" {...register("method")} className="hidden" />
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        On-Screen Dynamic UPI QR
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Customer scans your phone with GPay, PhonePe, or Paytm. Auto-verified in 3s.
                    </p>
                  </div>
                </label>

                {/* Option 2: Manual UPI Reference / UTR */}
                <label
                  onClick={() => setValue("method", "upi")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    method === "upi" 
                      ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-sm" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  <input type="radio" value="upi" {...register("method")} className="hidden" />
                  <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      Manual UPI / Bank Transfer
                    </span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Customer transferred directly to company account. Enter 12-digit UTR.
                    </p>
                  </div>
                </label>

                {/* Option 3: Cash on Site (Admin Gated) */}
                <div
                  className={`flex flex-col gap-2 p-3.5 rounded-2xl border-2 transition-all ${
                    !isCashApproved 
                      ? "border-zinc-200/80 bg-zinc-50/80 dark:bg-zinc-900/50 opacity-90"
                      : method === "cash"
                        ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30"
                        : "border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isCashApproved) setValue("method", "cash");
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      value="cash" 
                      disabled={!isCashApproved} 
                      {...register("method")} 
                      className="hidden" 
                    />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCashApproved ? "bg-amber-500 text-white" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                    }`}>
                      {isCashApproved ? <Banknote className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          Cash Collection on Site
                        </span>
                        {!isCashApproved ? (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Requires Approval
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Approved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {!isCashApproved 
                          ? "Company policy restricts physical cash. Admin approval required."
                          : "Physically collect cash and hand over with customer signature."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Cash Request Button if not approved */}
                  {!isCashApproved && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-medium">Customer insists on cash?</span>
                      {cashApprovalRequested ? (
                        <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Request Sent to Admin Desk
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestCashApproval}
                          disabled={isRequestingCashApproval}
                          className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          {isRequestingCashApproval ? <Loader2 className="w-3 h-3 animate-spin" /> : "Request Admin Approval"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Amount to Collect (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="number"
                    {...register("amount", { required: true, min: 1 })}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-base font-bold text-zinc-900 dark:text-white"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              {method === "upi" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    UTR / Bank Reference Number
                  </label>
                  <input
                    type="text"
                    {...register("utrNumber", { required: method === "upi" })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono text-sm"
                    placeholder="12-digit UTR number"
                  />
                </div>
              )}

              {/* Action Buttons */}
              {method === "qr_upi" ? (
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  disabled={!currentAmount || Number(currentAmount) <= 0}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <QrCode className="w-5 h-5" />
                  Show On-Screen QR (₹{Number(currentAmount || 0).toLocaleString('en-IN')})
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || (method === "cash" && !isCashApproved)}
                  className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Verification"}
                </button>
              )}
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Embedded Dynamic QR Modal */}
      <DynamicOnScreenQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        quoteId={quoteId}
        leadId={leadId}
        amount={Number(currentAmount) || expectedAmount || 0}
        paymentType="installation_final"
        title="On-Site Handover Payment"
        onSuccess={() => {
          setIsQrModalOpen(false);
          onClose();
        }}
      />
    </>
  );
}
