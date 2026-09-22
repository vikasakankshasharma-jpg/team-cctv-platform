"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Banknote, X, Loader2, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface SubmitPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  quoteId: string;
}

interface PaymentFormData {
  amount: string;
  method: "cash" | "upi";
  utrNumber: string;
}

export default function SubmitOfflinePaymentModal({ isOpen, onClose, leadId, quoteId }: SubmitPaymentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      method: "upi",
      amount: "",
      utrNumber: ""
    }
  });

  const method = watch("method");

  const onSubmit = async (data: PaymentFormData) => {
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold">Collect Offline Payment</h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-semibold">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={"flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all " + (method === "upi" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-zinc-200 dark:border-zinc-800")}>
                  <input type="radio" value="upi" {...register("method")} className="hidden" />
                  <CreditCard className={"w-5 h-5 " + (method === "upi" ? "text-blue-500" : "text-zinc-400")} />
                  <span className="font-medium text-sm">Direct UPI</span>
                </label>
                <label className={"flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all " + (method === "cash" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-zinc-200 dark:border-zinc-800")}>
                  <input type="radio" value="cash" {...register("method")} className="hidden" />
                  <Banknote className={"w-5 h-5 " + (method === "cash" ? "text-emerald-500" : "text-zinc-400")} />
                  <span className="font-medium text-sm">Cash on Site</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Amount Collected (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  {...register("amount", { required: true, min: 1 })}
                  className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            {method === "upi" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">UTR / Reference Number</label>
                <input
                  type="text"
                  {...register("utrNumber", { required: method === "upi" })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  placeholder="12-digit UTR number"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Verification"}
            </button>
            <p className="text-xs text-center text-zinc-500 mt-3">
              If you are a Trusted Collector, this will be approved instantly.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
