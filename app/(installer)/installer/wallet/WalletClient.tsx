"use client";

import { useState } from "react";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Loader2, Building, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { LedgerTransaction, Installer } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface WalletClientProps {
  installer: Installer;
  balance: number;
  transactions: LedgerTransaction[];
}

export function WalletClient({ installer, balance, transactions }: WalletClientProps) {
  const router = useRouter();
  
  // Bank Details State
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifsc: "",
    accountName: "",
    panNumber: "",
  });
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);
  
  // Payout Request State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const hasBankDetails = !!installer.bank_details;

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBank(true);
    try {
      const res = await fetch("/api/installer/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_details: {
            account_number: bankDetails.accountNumber,
            ifsc_code: bankDetails.ifsc.toUpperCase(),
            account_holder_name: bankDetails.accountName,
            pan_number: bankDetails.panNumber.toUpperCase(),
          }
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update bank details");
      }

      toast.success("Bank details updated successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      toast.error("Invalid amount");
      return;
    }
    
    setIsSubmittingPayout(true);
    try {
      const res = await fetch("/api/installer/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to request payout");
      }

      toast.success("Payout request submitted successfully");
      setShowPayoutModal(false);
      setPayoutAmount("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Wallet & Ledger
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track your cash collected on-site against your payouts and hardware deposits.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-zinc-500 mb-1">Current Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              ₹{Math.abs(balance).toLocaleString("en-IN")}
            </span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${balance >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
              {balance >= 0 ? "CREDIT" : "DUE TO ADMIN"}
            </span>
          </div>
          {balance < 0 && (
            <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> You owe the platform. Please settle to receive new jobs.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {balance > 0 && hasBankDetails && (
            <Button
              onClick={() => setShowPayoutModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md shadow-blue-500/20 font-semibold"
            >
              Request Payout
            </Button>
          )}
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {!hasBankDetails && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Add Bank Details</h2>
              <p className="text-xs font-medium text-zinc-500">Required to receive payouts</p>
            </div>
          </div>

          <form onSubmit={handleBankSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
            <div className="space-y-1.5">
              <Label htmlFor="accountName" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Account Holder Name</Label>
              <Input
                id="accountName"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                required
                className="rounded-xl bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500"
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accountNumber" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Account Number</Label>
              <Input
                id="accountNumber"
                type="text"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                required
                className="rounded-xl bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500"
                placeholder="e.g. 1234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ifsc" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">IFSC Code</Label>
              <Input
                id="ifsc"
                value={bankDetails.ifsc}
                onChange={(e) => setBankDetails(prev => ({ ...prev, ifsc: e.target.value }))}
                required
                className="rounded-xl bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500 uppercase"
                placeholder="e.g. HDFC0001234"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panNumber" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">PAN Number</Label>
              <Input
                id="panNumber"
                value={bankDetails.panNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, panNumber: e.target.value }))}
                required
                className="rounded-xl bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500 uppercase"
                placeholder="e.g. ABCDE1234F"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmittingBank}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-md shadow-blue-500/20 font-semibold transition-all"
              >
                {isSubmittingBank ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Bank Details"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {hasBankDetails && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Bank Details Verified</h3>
               <p className="text-xs font-medium text-zinc-500 mt-0.5">
                 {installer.bank_details?.account_holder_name} • ••••{installer.bank_details?.account_number?.slice(-4)}
               </p>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-black tracking-tight text-zinc-900 dark:text-white">Recent Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm font-medium">
            No transactions found yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    ["payout", "deposit"].includes(tx.type) ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {["payout", "deposit"].includes(tx.type) ? <ArrowUpFromLine className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{tx.description}</p>
                    <p className="text-xs font-medium text-zinc-500 capitalize mt-0.5">
                      {tx.type.replace("_", " ")} {tx.job_id && <span className="text-zinc-400 ml-1">• Job: {tx.job_id.slice(0, 6)}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black tracking-tight ${
                    ["payout", "deposit"].includes(tx.type) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {["payout", "deposit"].includes(tx.type) ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
                    {tx.created_at ? formatDistanceToNow((tx.created_at as any).toDate?.() || new Date(), { addSuffix: true }) : "Just now"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden scale-in-95">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Request Payout</h2>
              <p className="text-sm font-medium text-zinc-500 mb-6">
                Enter the amount you wish to withdraw. Maximum available: <span className="font-bold text-zinc-900 dark:text-zinc-300">₹{balance.toLocaleString("en-IN")}</span>
              </p>
              
              <form onSubmit={handlePayoutSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    max={balance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="text-lg font-bold rounded-xl bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 h-12"
                    placeholder="0"
                  />
                  {payoutAmount && Number(payoutAmount) > balance && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">Amount exceeds available balance.</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPayoutModal(false)}
                    disabled={isSubmittingPayout}
                    className="rounded-full font-semibold px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPayout || !payoutAmount || Number(payoutAmount) <= 0 || Number(payoutAmount) > balance}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-md shadow-blue-500/20 font-semibold"
                  >
                    {isSubmittingPayout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
