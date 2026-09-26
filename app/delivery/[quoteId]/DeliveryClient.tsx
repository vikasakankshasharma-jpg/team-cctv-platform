"use client";

import { useState } from "react";
import { DeliveryFailureModal } from "@/components/delivery/DeliveryFailureModal";
import { PackageCheck, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DeliveryClient({ quoteId, quote }: { quoteId: string, quote: any }) {
  const [otp, setOtp] = useState("");
  const [cashCollected, setCashCollected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If this quote expects Cash on Delivery and is assigned to internal staff
  const requiresCashCollection = quote.payment_preference === "cash_on_delivery" && quote.assigned_delivery_staff?.role === "internal";
  // The amount to collect is the remaining 90%. (Or calculated based on quote data)
  // For simplicity based on prompt, we assume ~90% or the actual expected amount.
  const expectedAmount = quote.total_payable ? quote.total_payable - (quote.advance_payment_amount || 500) : 0;

  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast.error("Please enter a 4-digit OTP.");
      return;
    }
    if (requiresCashCollection && !cashCollected) {
      toast.error("Please confirm cash collection before submitting.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/delivery/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quoteId, 
          otp,
          cashCollected: requiresCashCollection ? true : undefined,
          cashAmount: requiresCashCollection ? expectedAmount : undefined
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        toast.success("Delivery Confirmed!");
      } else {
        toast.error(data.error || "Invalid OTP.");
      }
    } catch (e) {
      toast.error("Network error. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (quote.delivery_status === "DELIVERED" || isSuccess) {
    return (
      <div className="bg-white rounded-3xl p-4 md:p-8 max-w-sm w-full shadow-lg text-center border border-zinc-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Delivery Completed</h2>
        <p className="text-sm text-zinc-500">The OTP was verified and the status is updated.</p>
        {requiresCashCollection && (
          <p className="text-xs text-emerald-600 font-bold mt-4 bg-emerald-50 py-2 rounded-lg">Cash Collection Verified</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
          <PackageCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900">Delivery Handover</h2>
          <p className="text-xs text-zinc-500">Quote #{quoteId.slice(0, 6)}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-zinc-700 mb-1">Customer: <strong className="text-zinc-900">{quote.customer_name || quote.customer?.name}</strong></p>
        <p className="text-xs text-zinc-500">{quote.address?.full_address || quote.installationAddress}</p>
      </div>

      {quote.payment_preference === "cash_on_delivery" && quote.assigned_delivery_staff?.role === "third_party" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-xs flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>Online Payment Required.</strong> Do NOT collect cash. Wait for the customer to pay the remaining balance via their online link to generate the OTP.
          </p>
        </div>
      )}

      {requiresCashCollection && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-emerald-800 font-medium mb-3">
            Amount to Collect: <strong className="text-base font-bold">₹{expectedAmount.toLocaleString()}</strong>
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={cashCollected}
              onChange={(e) => setCashCollected(e.target.checked)}
              className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-emerald-900 leading-tight">
              I confirm I have physically collected ₹{expectedAmount.toLocaleString()} in cash or UPI.
            </span>
          </label>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-xs font-bold text-zinc-700 mb-2">Customer OTP</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-lg font-bold tracking-[0.5em] text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="••••"
          />
        </div>
        <p className="text-[10px] text-zinc-400 mt-2 text-center">Ask the customer for the 4-digit code sent to their phone.</p>
      </div>

      <button
        onClick={handleVerify}
        disabled={isVerifying || otp.length !== 4 || (requiresCashCollection && !cashCollected)}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 mb-3"
      >
        {isVerifying ? "Verifying..." : "Verify Delivery"}
      </button>

      <button
        onClick={() => setIsFailureModalOpen(true)}
        className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl text-sm transition-all"
      >
        Report Delivery Failure
      </button>

      <DeliveryFailureModal
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        quoteId={quoteId}
        leadId={quote.lead_id}
      />
    </div>
  );
}
