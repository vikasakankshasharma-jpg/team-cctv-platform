"use client";

import { useState } from "react";
import { DeliveryFailureModal } from "@/components/delivery/DeliveryFailureModal";
import { 
  PackageCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Banknote, 
  Lock, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert,
  IndianRupee 
} from "lucide-react";
import { toast } from "sonner";
import { DynamicOnScreenQRCodeModal } from "@/components/shared/DynamicOnScreenQRCodeModal";

export default function DeliveryClient({ quoteId, quote }: { quoteId: string, quote: any }) {
  const [otp, setOtp] = useState("");
  const [cashCollected, setCashCollected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic QR & Cash approval states
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [upiPaymentVerified, setUpiPaymentVerified] = useState(false);
  const [isRequestingCash, setIsRequestingCash] = useState(false);
  const [cashRequested, setCashRequested] = useState(false);

  // 1. Detect if Quote is already fully paid upfront (e.g. Smart Pay 2% discount)
  const isFullyPaid = 
    quote.status === "PAID" || 
    quote.payment_status === "paid" || 
    quote.payment_type === "full" ||
    quote.payment_type === "full_discount" ||
    quote.payment_type === "full_discounted" ||
    (quote.amount_due === 0 && (quote.amount_paid || 0) > 500);

  const totalPayable = Number(
    quote.total_payable_after_discount ??
    quote.total_amount ??
    quote.pricingSnapshot?.total_payable ??
    quote.total_payable ??
    0
  );

  const amountPaid = Number(quote.amount_paid ?? (isFullyPaid ? totalPayable : (quote.advance_payment_amount || 500)));
  const expectedAmount = isFullyPaid ? 0 : Math.max(0, Number(quote.amount_due ?? (totalPayable - amountPaid)));

  // Cash is strictly gated: ONLY allowed if Admin explicitly approved cash for this lead/quote
  const isCashApproved = Boolean(quote.cash_collection_approved || quote.job_level_cash_authority);

  const handleRequestCashApproval = async () => {
    setIsRequestingCash(true);
    try {
      const res = await fetch("/api/installer/cash-approval/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          leadId: quote.lead_id || quoteId,
          amount: expectedAmount,
          reason: "Customer requested cash on delivery handover"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCashRequested(true);
        toast.success("Cash approval requested from Admin desk!");
      } else {
        toast.error(data.error || "Failed to request cash approval");
      }
    } catch {
      toast.error("Network error requesting cash approval");
    } finally {
      setIsRequestingCash(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast.error("Please enter a 4-digit OTP.");
      return;
    }

    // If an amount is due at delivery, ensure either UPI QR was paid or cash was collected with approval
    if (!isFullyPaid && expectedAmount > 0 && !upiPaymentVerified && !cashCollected) {
      toast.error("Please collect payment via On-Screen UPI QR or confirm cash before verifying.");
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
          cashCollected: cashCollected ? true : undefined,
          cashAmount: cashCollected ? expectedAmount : undefined,
          upiVerified: upiPaymentVerified ? true : undefined
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
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-lg text-center border border-zinc-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Delivery Completed</h2>
        <p className="text-sm text-zinc-500">The OTP was verified and materials marked delivered.</p>
        
        {isFullyPaid && (
          <p className="text-xs text-emerald-700 font-bold mt-4 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
            ✓ Smart Pay / Fully Paid Order
          </p>
        )}
        {upiPaymentVerified && (
          <p className="text-xs text-emerald-700 font-bold mt-4 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
            ✓ ₹{expectedAmount.toLocaleString('en-IN')} Received via On-Screen UPI QR
          </p>
        )}
        {cashCollected && (
          <p className="text-xs text-emerald-700 font-bold mt-4 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
            ✓ Cash Collection Verified by Admin
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Delivery Handover</h2>
            <p className="text-xs text-zinc-500">Quote #{quoteId.slice(0, 8)}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-zinc-700 mb-1">
            Customer: <strong className="text-zinc-900">{quote.customer_name || quote.customer?.name}</strong>
          </p>
          <p className="text-xs text-zinc-500">{quote.address?.full_address || quote.installationAddress}</p>
        </div>

        {/* 1. Fully Paid Notification */}
        {isFullyPaid ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Fully Paid (Smart Pay)</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Customer paid in full upfront. Zero collection required. Ask customer for delivery OTP.
              </p>
            </div>
          </div>
        ) : (
          /* 2. Amount Due & On-Screen Dynamic UPI QR Option */
          <div className="space-y-4 mb-6">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Material Delivery Due (90%)
                </span>
                <span className="text-base font-black text-zinc-900">
                  ₹{expectedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Customer scans the dynamic QR directly on your mobile screen.
              </p>
            </div>

            {/* If UPI already paid */}
            {upiPaymentVerified ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>₹{expectedAmount.toLocaleString('en-IN')} Received via UPI QR!</span>
              </div>
            ) : (
              /* Show On-Screen UPI QR Button */
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <QrCode className="w-5 h-5" />
                <span>Show On-Screen UPI QR (₹{expectedAmount.toLocaleString('en-IN')})</span>
              </button>
            )}

            {/* Admin-Gated Physical Cash Collection */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isCashApproved 
                ? "bg-amber-50/60 border-amber-200" 
                : "bg-zinc-50 border-zinc-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-800">
                  <Banknote className="w-4 h-4 text-amber-600" /> Pay Cash on Delivery
                </span>
                {!isCashApproved && (
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Admin Gated
                  </span>
                )}
              </div>

              {isCashApproved ? (
                <label className="flex items-start gap-2.5 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={cashCollected}
                    onChange={(e) => setCashCollected(e.target.checked)}
                    className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-amber-950 font-medium leading-tight">
                    Admin Approved: I confirm I have physically collected ₹{expectedAmount.toLocaleString('en-IN')} in cash.
                  </span>
                </label>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Cash collection is strictly disabled without authorization. Ask customer to scan the On-Screen QR above, or request Admin approval.
                  </p>
                  {cashRequested ? (
                    <div className="text-[11px] font-bold text-amber-700 bg-amber-100 py-1.5 px-3 rounded-xl text-center">
                      Approval request sent to Admin desk
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestCashApproval}
                      disabled={isRequestingCash}
                      className="w-full py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      {isRequestingCash ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Request Admin Cash Approval"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-700 mb-2">Customer Delivery OTP</label>
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
          <p className="text-[10px] text-zinc-400 mt-2 text-center">
            Ask customer for the 4-digit code sent to their WhatsApp.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={
            isVerifying || 
            otp.length !== 4 || 
            (!isFullyPaid && expectedAmount > 0 && !upiPaymentVerified && !cashCollected)
          }
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

      {/* Dynamic On-Screen UPI QR Modal */}
      <DynamicOnScreenQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        quoteId={quoteId}
        leadId={quote.lead_id}
        amount={expectedAmount}
        paymentType="delivery_90"
        title="Delivery Handover (90%)"
        onSuccess={() => {
          setIsQrModalOpen(false);
          setUpiPaymentVerified(true);
          setCashCollected(false);
          toast.success("Delivery payment received! Enter OTP to complete handover.");
        }}
      />
    </>
  );
}
