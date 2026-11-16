"use client";

import React, { useState, useMemo } from "react";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  ShieldAlert, 
  DollarSign, 
  FileText, 
  Layers, 
  Sparkles,
  Info,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export interface RefundDialogProps {
  quoteId: string;
  paymentId?: string;
  amount?: number;
  quoteData?: any;
  onSuccess: () => void;
  onClose: () => void;
}

type RefundScenarioKey = "advance_cancel" | "delivery_full" | "delivery_partial" | "final_goodwill" | "full_contract_cancel" | "custom";

interface ScenarioOption {
  key: RefundScenarioKey;
  stage: "advance_booking" | "delivery_90" | "installation_final";
  isFullCancel: boolean;
  title: string;
  subtitle: string;
  defaultReason: string;
  defaultAmount?: (maxRefund: number, bookingAmt: number, deliveryAmt: number, finalAmt: number) => number;
}

export function RefundDialog({ quoteId, paymentId, amount, quoteData, onSuccess, onClose }: RefundDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<RefundScenarioKey>("custom");
  const [refundAmountInput, setRefundAmountInput] = useState<string>("");
  const [reason, setReason] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(paymentId || "");
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  // Financial metrics from quoteData or props
  const totalPayable = Number(quoteData?.total_payable ?? quoteData?.pricingSnapshot?.total_payable ?? amount ?? 0);
  const totalPaid = Number(quoteData?.amount_paid ?? quoteData?.paid_amount ?? amount ?? totalPayable);
  const alreadyRefunded = Number(quoteData?.refund_amount ?? 0);
  const maxRefundable = Math.max(0, totalPaid - alreadyRefunded);

  const bookingAmount = Number(quoteData?.booking_amount ?? 500);
  const deliveryAmount = Number(quoteData?.delivery_amount ?? Math.round((totalPayable - bookingAmount) * 0.9));
  const finalAmount = Number(quoteData?.installation_amount ?? Math.max(0, totalPayable - bookingAmount - deliveryAmount));

  // Determine available payments
  const availablePayments = useMemo(() => {
    const list: Array<{ id: string; label: string; stage: string; amount?: number }> = [];
    if (quoteData?.razorpay_payment_id) {
      list.push({ id: quoteData.razorpay_payment_id, label: `Advance Token (${quoteData.razorpay_payment_id})`, stage: "advance_booking", amount: bookingAmount });
    }
    if (quoteData?.delivery_payment_id) {
      list.push({ id: quoteData.delivery_payment_id, label: `90% Delivery Milestone (${quoteData.delivery_payment_id})`, stage: "delivery_90", amount: deliveryAmount });
    }
    if (quoteData?.installation_payment_id) {
      list.push({ id: quoteData.installation_payment_id, label: `10% Installation Milestone (${quoteData.installation_payment_id})`, stage: "installation_final", amount: finalAmount });
    }
    if (list.length === 0 && paymentId) {
      list.push({ id: paymentId, label: `Gateway Payment (${paymentId})`, stage: "advance_booking", amount: totalPaid });
    }
    return list;
  }, [quoteData, paymentId, bookingAmount, deliveryAmount, finalAmount, totalPaid]);

  // Set default payment if none selected
  React.useEffect(() => {
    if (!selectedPaymentId && availablePayments.length > 0) {
      setSelectedPaymentId(availablePayments[availablePayments.length - 1].id);
    }
  }, [availablePayments, selectedPaymentId]);

  // Pre-configured Scenarios
  const scenarios: ScenarioOption[] = [
    {
      key: "advance_cancel",
      stage: "advance_booking",
      isFullCancel: true,
      title: "Stage 1: Advance Token Refund (₹500)",
      subtitle: "Customer cancelled booking before dispatch. Cancel job & return token.",
      defaultReason: "Customer requested cancellation prior to material dispatch",
      defaultAmount: (_, bookingAmt) => Math.min(bookingAmt || 500, maxRefundable)
    },
    {
      key: "delivery_full",
      stage: "delivery_90",
      isFullCancel: true,
      title: "Stage 2A: 90% Delivery Full Cancellation",
      subtitle: "Delivery rejected on-site. Cancel job card & restock hardware inventory.",
      defaultReason: "Customer rejected delivery on-site. Full cancellation & inventory restock.",
      defaultAmount: (maxRef) => maxRef
    },
    {
      key: "delivery_partial",
      stage: "delivery_90",
      isFullCancel: false,
      title: "Stage 2B: 90% Delivery Partial Hardware Adjustment",
      subtitle: "Hardware variation or item return. Job remains active for installation.",
      defaultReason: "Hardware adjustment on delivery (camera/cable quantity reduction).",
      defaultAmount: () => Math.min(1500, maxRefundable)
    },
    {
      key: "final_goodwill",
      stage: "installation_final",
      isFullCancel: false,
      title: "Stage 3A: 10% Final Goodwill / Service Adjustment",
      subtitle: "Post-installation credit for cable length discrepancy or customer courtesy.",
      defaultReason: "Post-handover goodwill credit for installation adjustment.",
      defaultAmount: () => Math.min(1000, maxRefundable)
    },
    {
      key: "full_contract_cancel",
      stage: "installation_final",
      isFullCancel: true,
      title: "Stage 3B: Complete Contract Cancellation Post-Handover",
      subtitle: "Complete system return. Retrieve all hardware & issue 100% refund.",
      defaultReason: "Complete contract cancellation post-handover with full hardware retrieval.",
      defaultAmount: (maxRef) => maxRef
    },
    {
      key: "custom",
      stage: "advance_booking",
      isFullCancel: false,
      title: "Custom Scenario & Amount",
      subtitle: "Manually specify any partial or full refund amount and custom operational notes.",
      defaultReason: "",
      defaultAmount: () => 0
    }
  ];

  const handleSelectScenario = (sc: ScenarioOption) => {
    setSelectedScenario(sc.key);
    setReason(sc.defaultReason);
    if (sc.defaultAmount) {
      const computedAmt = sc.defaultAmount(maxRefundable, bookingAmount, deliveryAmount, finalAmount);
      if (computedAmt > 0) {
        setRefundAmountInput(String(computedAmt));
      } else {
        setRefundAmountInput("");
      }
    }
    // Match payment ID to the stage if possible
    const matchingPayment = availablePayments.find(p => p.stage === sc.stage);
    if (matchingPayment) {
      setSelectedPaymentId(matchingPayment.id);
    }
  };

  const parsedAmount = Number(refundAmountInput) || 0;
  const isAmountValid = parsedAmount > 0 && parsedAmount <= maxRefundable;
  const willBeFullCancellation = parsedAmount >= maxRefundable || (selectedScenario === "advance_cancel" || selectedScenario === "delivery_full" || selectedScenario === "full_contract_cancel");

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast.error(t("adm_rf_err_reason", "Please provide an audit reason for the refund"));
      return;
    }

    if (!isAmountValid) {
      toast.error(t("adm_rf_err_amount", `Please enter a valid amount between ₹1 and ₹${maxRefundable.toLocaleString('en-IN')}`));
      return;
    }

    if (willBeFullCancellation && !confirmedRisk) {
      toast.error(t("adm_rf_err_confirm", "Please confirm that you understand this will cancel pending jobs and restock hardware."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          paymentId: selectedPaymentId || undefined,
          amount: parsedAmount,
          reason: `[${selectedScenario.toUpperCase()}] ${reason.trim()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");

      toast.success(
        t("adm_rf_success", "Refund ₹{amt} processed successfully via {stage}!", {
          amt: parsedAmount.toLocaleString("en-IN"),
          stage: data.refundStage || selectedScenario
        })
      );
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || t("adm_rf_err_generic", "An error occurred while processing refund"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in my-8 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                {t("adm_rf_title", "Process Multi-Stage Customer Refund")}
              </h3>
              <p className="text-xs text-zinc-400">
                {t("adm_rf_quote_lbl", "Quote ID:")} <span className="font-mono text-zinc-300 font-bold">{quoteId}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Financial Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{t("adm_rf_total_val", "Total Value")}</span>
              <span className="text-sm font-black text-white">₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">{t("adm_rf_total_paid", "Total Paid")}</span>
              <span className="text-sm font-black text-emerald-400">₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">{t("adm_rf_refunded", "Refunded So Far")}</span>
              <span className="text-sm font-black text-rose-400">₹{alreadyRefunded.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">{t("adm_rf_max_refund", "Refundable Balance")}</span>
              <span className="text-sm font-black text-blue-300">₹{maxRefundable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {maxRefundable <= 0 ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">
                {t("adm_rf_none_left", "This quotation has zero refundable balance remaining. All collected payments have already been settled or refunded.")}
              </p>
            </div>
          ) : (
            <>
              {/* Scenario Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("adm_rf_select_scenario", "1. Select Refund Stage & Operational Scenario")}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {scenarios.map((sc) => {
                    const isSelected = selectedScenario === sc.key;
                    return (
                      <button
                        key={sc.key}
                        type="button"
                        onClick={() => handleSelectScenario(sc)}
                        className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                          isSelected 
                            ? "bg-blue-600/10 border-blue-500 shadow-sm shadow-blue-500/10 ring-1 ring-blue-500" 
                            : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`text-xs font-bold block ${isSelected ? "text-blue-400" : "text-white"}`}>
                              {sc.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 leading-tight block mt-1">
                              {sc.subtitle}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gateway Payment Target Selection */}
              {availablePayments.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    {t("adm_rf_select_payment", "Target Gateway Payment")}
                  </label>
                  <select
                    value={selectedPaymentId}
                    onChange={(e) => setSelectedPaymentId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {availablePayments.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} {p.amount ? `[Max ₹${p.amount.toLocaleString('en-IN')}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Refund Amount Input with Preset Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t("adm_rf_amount_lbl", "2. Refund Amount (₹ INR)")}
                  </label>
                  <span className="text-xs text-zinc-500 font-medium">
                    {t("adm_rf_max_limit", "Max: ₹{max}", { max: maxRefundable.toLocaleString('en-IN') })}
                  </span>
                </div>
                
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">₹</span>
                  <input
                    type="number"
                    value={refundAmountInput}
                    onChange={(e) => setRefundAmountInput(e.target.value)}
                    max={maxRefundable}
                    min={1}
                    placeholder="Enter amount..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-8 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[500, 1000, 1500].filter(a => a <= maxRefundable).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRefundAmountInput(String(amt))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRefundAmountInput(String(maxRefundable))}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
                  >
                    {t("adm_rf_full_balance", "Full Balance (₹{amt})", { amt: maxRefundable.toLocaleString('en-IN') })}
                  </button>
                </div>
              </div>

              {/* Reason for Audit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("adm_rf_reason_lbl", "3. Audit Reason (Required for Accounting)")}
                </label>
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  rows={2}
                  placeholder="e.g. Customer cancelled before dispatch, material return..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* Dynamic Operational Impact Warning */}
              {parsedAmount > 0 && (
                <div>
                  {willBeFullCancellation ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-rose-300 font-bold">
                            {t("adm_rf_full_cancel_title", "Full Contract Cancellation Impact")}
                          </p>
                          <p className="text-[11px] text-rose-400/90 leading-relaxed">
                            {t("adm_rf_full_cancel_desc", "This refund will cancel all associated technician jobs, reverse hardware deductions back into warehouse inventory, mark the quote as CANCELLED, and notify the customer via WhatsApp.")}
                          </p>
                        </div>
                      </div>
                      
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmedRisk}
                          onChange={(e) => setConfirmedRisk(e.target.checked)}
                          className="w-4 h-4 rounded border-rose-500 text-rose-600 focus:ring-rose-500 bg-zinc-900"
                        />
                        <span className="text-xs font-bold text-rose-200">
                          {t("adm_rf_confirm_chk", "I confirm this is an intentional full cancellation")}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-blue-300 leading-relaxed">
                        <span className="font-bold block">{t("adm_rf_partial_title", "Partial Operational Adjustment")}</span>
                        {t("adm_rf_partial_desc", "A balance of ₹{bal} remains paid. Field installation and job cards will remain ACTIVE. The quotation status will be updated to Partially Refunded.", {
                          bal: (maxRefundable - parsedAmount).toLocaleString('en-IN')
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/80 bg-zinc-900/60">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            {t("adm_rf_cancel_btn", "Close")}
          </button>
          
          {maxRefundable > 0 && (
            <button
              onClick={handleRefund}
              disabled={loading || !isAmountValid || (willBeFullCancellation && !confirmedRisk)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {t("adm_rf_submit_btn", "Execute Refund ₹{amt}", { amt: parsedAmount > 0 ? parsedAmount.toLocaleString('en-IN') : "0" })}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
