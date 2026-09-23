"use client";

import React, { useState } from "react";
import { CheckCircle2, Lock, ArrowRight, ExternalLink, RefreshCw, Send, Download } from "lucide-react";
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

  // Total amount from lead or quote
  const totalAmount = lead?.total_payable || quote?.total_payable || quote?.total || 0;
  
  if (!totalAmount || totalAmount <= 0) return null;

  // Calculate Stages
  const stage1Amount = 500;
  const remaining = totalAmount - 500;
  const stage2Amount = Math.round(remaining * 0.90);
  const stage3Amount = Math.round(remaining * 0.10);

  // Status Logic
  // Stage 1 (Booking) is paid if payment_status is any of these or if booking_amount > 0
  const isStage1Paid = 
    lead?.booking_amount > 0 || 
    ["advance_paid", "delivery_paid", "paid", "captured"].includes(lead?.payment_status) ||
    lead?.status === "booked" || 
    lead?.status === "won" ||
    lead?.status === "dispatched" ||
    lead?.status === "delivered";

  // Stage 2 (Delivery) is unlocked if dispatched or delivered
  const isStage2Unlocked = 
    lead?.delivery_status === "DISPATCHED" || 
    lead?.delivery_status === "DELIVERED" || 
    ["delivery_paid", "paid"].includes(lead?.payment_status);

  // Stage 2 is paid if delivery_paid or fully paid
  const isStage2Paid = 
    lead?.delivery_amount > 0 || 
    ["delivery_paid", "paid"].includes(lead?.payment_status);

  // Stage 3 (Installation) is unlocked if installation is complete or delivery is done (and they're paying on spot)
  const isStage3Unlocked = 
    lead?.install_status === "COMPLETED" || 
    lead?.completion_pin_verified === true ||
    lead?.payment_status === "paid";

  // Stage 3 is paid if fully paid
  const isStage3Paid = 
    lead?.installation_amount > 0 || 
    lead?.payment_status === "paid";

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

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Payment Stages
            {progressPercent === 100 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Fully Paid</span>
            )}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Total Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-300">{formatCurrency(totalAmount)}</span>
          </p>
        </div>
        
        {progressPercent > 0 && (
          <button 
            className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
            onClick={() => window.open(`/api/quote/${quoteId}/pdf`, '_blank')}
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Stage 1: Booking */}
        <div className={`p-4 rounded-2xl border ${isStage1Paid ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                {isStage1Paid ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />}
                <h3 className="font-semibold text-zinc-900 dark:text-white">Stage 1: Booking Amount</h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7 mt-0.5">Locks your price and initiates dispatch.</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(stage1Amount)}</span>
              {isStage1Paid && <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">PAID</div>}
            </div>
          </div>
          {isStage1Paid && stage1History?.razorpay_payment_id && (
            <div className="ml-7 mt-2 text-xs text-zinc-500 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg inline-block border border-zinc-100 dark:border-zinc-800">
              Txn: {stage1History.razorpay_payment_id}
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
                {!isStage3Unlocked ? 'Unlocks after successful installation.' : 'Final 10% payment for installation & warranty.'}
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
    </div>
  );
}
