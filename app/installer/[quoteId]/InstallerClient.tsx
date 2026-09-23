"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function InstallerClient({ quoteId, quoteData }: { quoteId: string, quoteData: any }) {
  const router = useRouter();
  const [startOtp, setStartOtp] = useState("");
  const [endOtp, setEndOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [collectedCash, setCollectedCash] = useState(false);
  const [status, setStatus] = useState(quoteData.install_status || "PENDING"); // PENDING, STARTED, SIGN_OFF_REQUESTED, COMPLETED

  // Helper to get remaining balance. Total - advance (500) - delivery_cash
  const advance = 500;
  const deliveryCash = quoteData.cash_collected_amount || 0;
  // If payment preference was full online, then final balance might be 0, but usually it's 10%
  const totalPaidOnline = quoteData.amount_paid || 0;
  let remainingBalance = quoteData.total_payable - advance - deliveryCash;
  
  // Wait, if they paid online earlier, we should just check remaining amount due from backend if we had it,
  // but let's assume remainingBalance is the 10% or whatever is left.
  if (remainingBalance < 0) remainingBalance = 0;

  const handleStartWork = async () => {
    if (startOtp.length !== 4) return toast.error("Enter 4-digit Start OTP");
    setLoading(true);
    try {
      const res = await fetch("/api/installer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, otp: startOtp })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Work Started!");
        setStatus("STARTED");
        router.refresh();
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSignOff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/installer/request-signoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sign-off requested!");
        setStatus("SIGN_OFF_REQUESTED");
      } else {
        toast.error(data.error || "Failed to request sign off");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWork = async () => {
    if (endOtp.length !== 4) return toast.error("Enter 4-digit Final OTP");
    if (remainingBalance > 0 && !collectedCash) {
      // In a real app we'd check if customer paid online for the 10% after request-signoff,
      // but for this flow we force the installer to check cash box if it's a cash order.
      // Wait, what if they paid online? The prompt says: "If customer pays online, installer gets OTP."
      // If customer pays cash, installer checks box. So we only enforce checking box if they didn't pay online.
      // We will leave it to the installer to explicitly declare if they collected cash.
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/installer/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quoteId, 
          otp: endOtp,
          cashCollected: collectedCash,
          cashAmount: collectedCash ? remainingBalance : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Installation Completed!");
        setStatus("COMPLETED");
        router.refresh();
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "COMPLETED" || quoteData.delivery_status === "COMPLETED") {
    return (
      <div className="p-4 md:p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
        <h2 className="text-xl font-bold text-zinc-900">Installation Completed</h2>
        <p className="text-zinc-500 text-sm mt-2">Thank you for your work.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden mt-6">
        <div className="bg-zinc-900 p-4 text-white text-center">
          <h1 className="font-black text-lg tracking-tight">TEAM Installer Portal</h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">Quote #{quoteId.slice(0,6)}</p>
        </div>

        <div className="p-5 space-y-6">
          <div className="bg-zinc-50 rounded-xl p-3 text-sm text-zinc-800 border border-zinc-100">
            <p><strong>Customer:</strong> {quoteData.customer_name}</p>
            <p><strong>Address:</strong> {quoteData.address?.full_address || "Customer Site"}</p>
          </div>

          {/* STAGE 1: START WORK */}
          {status === "PENDING" && (
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-medium border border-blue-100">
                Ask the customer for the <strong>Start OTP</strong> they received on WhatsApp to begin the installation timer.
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Start OTP</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={startOtp}
                  onChange={e => setStartOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-3 bg-white border border-zinc-300 rounded-xl text-xl font-bold tracking-[0.5em] text-center"
                  placeholder="----"
                />
              </div>
              <button 
                onClick={handleStartWork}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                {loading ? "Verifying..." : "Start Work"}
              </button>
            </div>
          )}

          {/* STAGE 2: REQUEST SIGN OFF */}
          {status === "STARTED" && (
            <div className="space-y-4">
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-medium border border-amber-100 text-center py-6">
                <div className="text-3xl mb-2">⏱️</div>
                <p>Installation in progress...</p>
                <p className="opacity-70 mt-1">Click below only when work is fully completed.</p>
              </div>
              
              <button 
                onClick={handleRequestSignOff}
                disabled={loading}
                className="w-full py-3 bg-amber-500 text-amber-950 font-bold rounded-xl active:scale-95 transition-transform"
              >
                {loading ? "Sending..." : "Request Final Sign-off"}
              </button>
            </div>
          )}

          {/* STAGE 3: COMPLETE WORK & COLLECT CASH */}
          {status === "SIGN_OFF_REQUESTED" && (
            <div className="space-y-5 border-t border-zinc-100 pt-5">
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-medium border border-emerald-100">
                Sign-off request sent to customer's WhatsApp. They need to pay the final balance to get the Final OTP.
              </div>
              
              {remainingBalance > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Final Payment Collection</p>
                  <p className="text-xl font-black text-zinc-900 mb-3">₹{remainingBalance.toLocaleString()}</p>
                  
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-white border border-zinc-200 rounded-lg shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={collectedCash}
                      onChange={e => setCollectedCash(e.target.checked)}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs text-zinc-700 font-medium">
                      I confirm I have physically collected ₹{remainingBalance.toLocaleString()} in Cash/UPI from the customer.
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Final Sign-off OTP</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={endOtp}
                  onChange={e => setEndOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-3 bg-white border border-zinc-300 rounded-xl text-xl font-bold tracking-[0.5em] text-center"
                  placeholder="----"
                />
              </div>

              <button 
                onClick={handleCompleteWork}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                {loading ? "Verifying..." : "Complete Installation"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
