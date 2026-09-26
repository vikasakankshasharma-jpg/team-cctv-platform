"use client";

import React, { useState } from "react";
import { CheckCircle2, Lock, ArrowRight, ExternalLink, RefreshCw, Send, Download, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

interface PaymentStagesWidgetProps {
  quoteId: string;
  lead: any;
  quote?: any;
  onPaymentSuccess?: () => void;
  isAdmin?: boolean;
}

export function PaymentStagesWidget({ quoteId, lead, quote, onPaymentSuccess, isAdmin = false }: PaymentStagesWidgetProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Total amount from lead or quote
  const totalAmount = lead?.total_payable || quote?.total_payable || quote?.total || 0;
  
  if (!totalAmount || totalAmount <= 0) return null;

  // Calculate Stages
  const stage1Amount = 500;
  const remaining = totalAmount - 500;
  const stage2Amount = Math.round(remaining * 0.90);
  const stage3Amount = Math.round(remaining * 0.10);

  // Status Logic
  // Stage 1 (Booking) is paid if payment_status is any of these or if booking_amount > 0 or amount_paid >= 500
  const isStage1Paid = 
    (lead?.booking_amount > 0 || quote?.booking_amount > 0 || (quote?.amount_paid || 0) >= 500 || (lead?.amount_paid || 0) >= 500) || 
    ["advance_paid", "delivery_paid", "paid", "captured"].includes(lead?.payment_status) ||
    ["advance_paid", "delivery_paid", "paid", "captured"].includes(quote?.payment_status) ||
    ["booked", "won", "dispatched", "delivered"].includes(String(lead?.status || "").toLowerCase()) || 
    ["booked", "paid"].includes(String(quote?.status || "").toLowerCase());

  // Stage 2 (Delivery) is unlocked if Stage 1 is paid OR if it's dispatched
  const isStage2Unlocked = 
    isStage1Paid ||
    lead?.delivery_status === "DISPATCHED" || 
    lead?.delivery_status === "DELIVERED" || 
    quote?.delivery_status === "DISPATCHED" ||
    quote?.delivery_status === "DELIVERED" ||
    ["delivery_paid", "paid"].includes(lead?.payment_status) ||
    ["delivery_paid", "paid"].includes(quote?.payment_status);

  // Stage 2 is paid if delivery_paid or fully paid
  const isStage2Paid = 
    ["delivery_paid", "paid"].includes(lead?.payment_status) ||
    ["delivery_paid", "paid"].includes(quote?.payment_status);

  // Stage 3 (Installation) is unlocked ONLY if Stage 2 is already paid
  const isStage3Unlocked = 
    isStage2Paid ||
    lead?.install_status === "COMPLETED" || 
    lead?.completion_pin_verified === true ||
    lead?.payment_status === "paid" ||
    quote?.payment_status === "paid" ||
    quote?.status === "COMPLETED";

  // Stage 3 is paid if fully paid
  const isStage3Paid = 
    lead?.payment_status === "paid" ||
    quote?.payment_status === "paid" ||
    quote?.status === "COMPLETED";

  const handlePayNow = async (paymentType: string) => {
    try {
      setLoadingType(`pay_${paymentType}`);
      const res = await fetch("/api/payment/razorpay-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          paymentType: paymentType,
          notes: {
            source: "customer_dashboard",
            payment_type: paymentType
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate payment link");
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingType(null);
    }
  };

  const handleResendLink = async (paymentType: string) => {
    try {
      setLoadingType(`resend_${paymentType}`);
      const res = await fetch("/api/payment/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          paymentType: paymentType
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend payment link");
      toast.success(isAdmin ? "Link sent to customer via WhatsApp" : "Payment link sent to your WhatsApp");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingType(null);
    }
  };

  // Find payment history for a specific stage
  const getPaymentHistory = (type: string) => {
    if (!lead?.payment_history || !Array.isArray(lead?.payment_history)) return null;
    return lead.payment_history.find((p: any) => p.payment_type === type || p.stage === type);
  };

  const stage1History = getPaymentHistory("advance_500_cod") || getPaymentHistory("advance_500");
  const stage2History = getPaymentHistory("delivery_90");
  const stage3History = getPaymentHistory("installation_final") || getPaymentHistory("full");

  // Calculate total paid and progress

  const totalPaid = (isStage1Paid ? stage1Amount : 0) + (isStage2Paid ? stage2Amount : 0) + (isStage3Paid ? stage3Amount : 0);
  const progressPercent = Math.min(100, Math.round((totalPaid / totalAmount) * 100));

  let currentStatusText = "Pending Booking Amount (Stage 1)";
  if (isStage3Paid) {
    currentStatusText = "Fully Paid";
  } else if (isStage2Paid) {
    currentStatusText = "Pending Installation (Stage 3)";
  } else if (isStage1Paid) {
    currentStatusText = "Pending Material Delivery (Stage 2)";
  }


  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div 
        className="flex flex-col gap-4 mt-2 cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Payment Status
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isStage3Paid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {currentStatusText}
                </span>
              </h2>
              <div className="sm:hidden text-zinc-400 group-hover:text-zinc-600 transition-colors bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-full">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Total Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-300">{formatCurrency(totalAmount)}</span>
              <span className="mx-2">•</span>
              Paid: <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
            </p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {progressPercent > 0 && (
              <button 
                className="flex items-center justify-center w-full sm:w-auto gap-2 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors"
                onClick={(e) => { e.stopPropagation(); window.open(`/api/quote/${quoteId}/pdf`, '_blank'); }}
              >
                <Download className="w-4 h-4" />
                Receipt
              </button>
            )}
            <div className="hidden sm:flex text-zinc-400 group-hover:text-zinc-600 transition-colors p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Horizontal Flowchart (Visible when collapsed OR expanded as a header) */}
        <div className="flex items-center gap-1 sm:gap-2 w-full mt-2 mb-2 overflow-x-auto pb-3 scrollbar-hide">
          {/* Step 1 */}
          <div className={`flex flex-col items-center flex-1 min-w-[70px] opacity-100 ${isStage1Paid ? 'text-emerald-600' : 'text-blue-600'}`}>
             <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 ${isStage1Paid ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 text-emerald-500' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]'}`}>
               {isStage1Paid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse" />}
             </div>
             <span className="text-[9px] sm:text-[10px] font-black mt-2 uppercase tracking-widest text-center">Booking</span>
          </div>

          <div className={`w-8 sm:w-12 h-0.5 shrink-0 rounded-full ${isStage1Paid ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />

          {/* Step 2 */}
          <div className={`flex flex-col items-center flex-1 min-w-[70px] opacity-100 ${isStage2Paid ? 'text-emerald-600' : isStage1Paid ? 'text-blue-600' : 'text-zinc-400 dark:text-zinc-600'}`}>
             <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 ${isStage2Paid ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 text-emerald-500' : isStage1Paid ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'}`}>
               {isStage2Paid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : isStage1Paid ? <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse" /> : <Lock className="w-3.5 h-3.5" />}
             </div>
             <span className="text-[9px] sm:text-[10px] font-black mt-2 uppercase tracking-widest text-center">Delivery</span>
          </div>

          <div className={`w-8 sm:w-12 h-0.5 shrink-0 rounded-full ${isStage2Paid ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />

          {/* Step 3 */}
          <div className={`flex flex-col items-center flex-1 min-w-[70px] opacity-100 ${isStage3Paid ? 'text-emerald-600' : isStage2Paid ? 'text-blue-600' : 'text-zinc-400 dark:text-zinc-600'}`}>
             <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 ${isStage3Paid ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 text-emerald-500' : isStage2Paid ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'}`}>
               {isStage3Paid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : isStage2Paid ? <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse" /> : <Lock className="w-3.5 h-3.5" />}
             </div>
             <span className="text-[9px] sm:text-[10px] font-black mt-2 uppercase tracking-widest text-center">Install</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
        {/* Stage 1: Booking */}
        <div className={`p-4 rounded-2xl border ${isStage1Paid ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                {isStage1Paid ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-blue-400" />}
                <h3 className={`font-semibold ${!isStage1Paid ? 'text-zinc-900 dark:text-white' : 'text-zinc-900 dark:text-white'}`}>Stage 1: Booking Amount</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7 mt-0.5">Locks your price and initiates dispatch.</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(stage1Amount)}</span>
              {isStage1Paid ? (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">PAID</div>
              ) : (
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wide">Due Now</div>
              )}
            </div>
          </div>
          {isStage1Paid && stage1History?.razorpay_payment_id && (
            <div className="ml-7 mt-2 text-xs text-zinc-500 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg inline-block border border-zinc-100 dark:border-zinc-800">
              Txn: {stage1History.razorpay_payment_id}
            </div>
          )}
          
          {!isStage1Paid && (
            <div className="ml-7 mt-3 flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handlePayNow('advance_500_cod')}
                disabled={loadingType !== null}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loadingType === 'pay_advance_500_cod' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Pay {formatCurrency(stage1Amount)} Now
              </button>
              <button 
                onClick={() => handleResendLink('advance_500_cod')}
                disabled={loadingType !== null}
                className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loadingType === 'resend_advance_500_cod' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAdmin ? "Send Link to Customer" : "Resend Link"}
              </button>
            </div>
          )}
        </div>

        {/* Stage 2: Delivery */}
        <div className={`p-4 rounded-2xl border transition-colors ${isStage2Paid ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : isStage2Unlocked ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800 opacity-75'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                {isStage2Paid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : !isStage2Unlocked ? (
                  <Lock className="w-5 h-5 text-zinc-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-400" />
                )}
                <h3 className={`font-semibold ${!isStage2Unlocked && !isStage2Paid ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                  Stage 2: Material Delivery
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7 mt-0.5">
                {!isStage2Unlocked ? 'Unlocks when material is dispatched.' : 'Pay 90% of remaining balance to receive delivery OTP.'}
              </p>
            </div>
            <div className="text-right">
              <span className={`font-bold ${!isStage2Unlocked && !isStage2Paid ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                {formatCurrency(stage2Amount)}
              </span>
              {isStage2Paid ? (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">PAID</div>
              ) : isStage2Unlocked ? (
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wide">Due Now</div>
              ) : null}
            </div>
          </div>
          
          {isStage2Paid && stage2History?.razorpay_payment_id && (
            <div className="ml-7 mt-2 text-xs text-zinc-500 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg inline-block border border-zinc-100 dark:border-zinc-800">
              Txn: {stage2History.razorpay_payment_id}
            </div>
          )}

          {isStage2Unlocked && !isStage2Paid && (
            <div className="ml-7 mt-3 flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handlePayNow('delivery_90')}
                disabled={loadingType !== null}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loadingType === 'pay_delivery_90' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Pay {formatCurrency(stage2Amount)} Now
              </button>
              <button 
                onClick={() => handleResendLink('delivery_90')}
                disabled={loadingType !== null}
                className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loadingType === 'resend_delivery_90' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAdmin ? "Send Link to Customer" : "Resend Link"}
              </button>
            </div>
          )}
        </div>

        {/* Stage 3: Installation */}
        <div className={`p-4 rounded-2xl border transition-colors ${isStage3Paid ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : isStage3Unlocked ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800 opacity-75'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                {isStage3Paid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : !isStage3Unlocked ? (
                  <Lock className="w-5 h-5 text-zinc-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-400" />
                )}
                <h3 className={`font-semibold ${!isStage3Unlocked && !isStage3Paid ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                  Stage 3: Installation Complete
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7 mt-0.5">
                {!isStage3Unlocked && !isStage2Paid ? 'Completes after Stage 2 payment is confirmed. Paid offline? Contact us to unlock.' : !isStage3Unlocked ? 'Unlocks after successful installation.' : 'Final 10% payment for installation & warranty.'}
              </p>
            </div>
            <div className="text-right">
              <span className={`font-bold ${!isStage3Unlocked && !isStage3Paid ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                {formatCurrency(stage3Amount)}
              </span>
              {isStage3Paid ? (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">PAID</div>
              ) : isStage3Unlocked ? (
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wide">Due Now</div>
              ) : null}
            </div>
          </div>

          {isStage3Paid && stage3History?.razorpay_payment_id && (
            <div className="ml-7 mt-2 text-xs text-zinc-500 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg inline-block border border-zinc-100 dark:border-zinc-800">
              Txn: {stage3History.razorpay_payment_id}
            </div>
          )}

          {isStage3Unlocked && !isStage3Paid && (
            <div className="ml-7 mt-3 flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handlePayNow('installation_final')}
                disabled={loadingType !== null}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loadingType === 'pay_installation_final' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Pay {formatCurrency(stage3Amount)} Now
              </button>
              <button 
                onClick={() => handleResendLink('installation_final')}
                disabled={loadingType !== null}
                className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loadingType === 'resend_installation_final' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAdmin ? "Send Link to Customer" : "Resend Link"}
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
