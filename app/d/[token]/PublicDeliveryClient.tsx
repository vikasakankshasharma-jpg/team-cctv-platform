"use client";

import { useState } from "react";
import { PackageCheck, KeyRound, CheckCircle2, AlertCircle, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PublicDeliveryClient({ quoteId, quote }: { quoteId: string; quote: any }) {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(quote.delivery_status === "DELIVERED");
  const [cashCollected, setCashCollected] = useState(false);

  const isThirdParty = quote.delivery_method === "third_party";
  const needsPaymentConfirmation = isThirdParty && quote.payment_status !== "delivery_paid" && quote.payment_status !== "completed";
  
  const balanceToCollect = quote.total_payable - quote.advance_payment_amount;
  const isInternalCashCollection = !isThirdParty && balanceToCollect > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
      return;
    }
    
    if (isInternalCashCollection && !cashCollected) {
      toast.error("Please confirm cash collection");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/delivery/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quoteId, 
          otp,
          cashCollected: isInternalCashCollection ? cashCollected : false,
          cashAmount: isInternalCashCollection ? balanceToCollect : 0
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }
      
      setIsSuccess(true);
      toast.success("Delivery confirmed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-zinc-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-2">Delivery Confirmed ✓</h2>
        <p className="text-zinc-500 mb-8">Thank you! The material delivery has been successfully verified.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-zinc-100">
      <div className="flex items-center justify-center gap-2 text-indigo-600 mb-8">
        <Shield className="w-8 h-8" />
        <span className="text-2xl font-bold tracking-tight">TEAM CCTV</span>
      </div>
      
      <div className="bg-zinc-50 rounded-2xl p-5 mb-8 border border-zinc-100">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <PackageCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-lg mb-1">{quote.customer_name}</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">{quote.address}</p>
          </div>
        </div>
      </div>

      {needsPaymentConfirmation ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-3 text-amber-800">
          <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <p className="text-sm font-medium">
            ⏳ Waiting for Customer Payment. The customer needs to complete their 90% payment before you can verify delivery. Please wait or contact support.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <KeyRound className="w-4 h-4" />
              Ask customer for 4-digit Delivery PIN
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-4xl tracking-[1em] font-mono h-16 rounded-2xl bg-zinc-50 border-zinc-200 placeholder:text-zinc-300 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          {isThirdParty && (
             <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm font-medium flex items-start gap-2">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <p>Do NOT collect cash. Online payment only.</p>
             </div>
          )}

          {isInternalCashCollection && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">Balance to Collect</p>
                <p className="text-2xl font-bold text-blue-900">₹{balanceToCollect.toLocaleString('en-IN')}</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-blue-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-blue-900 font-medium">
                  I confirm I have collected ₹{balanceToCollect.toLocaleString('en-IN')} in cash/UPI
                </span>
              </label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            disabled={isSubmitting || otp.length !== 4 || (isInternalCashCollection && !cashCollected)}
          >
            {isSubmitting ? "Verifying..." : "Verify Delivery"}
          </Button>
        </form>
      )}
    </div>
  );
}
