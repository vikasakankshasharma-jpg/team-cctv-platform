"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BillingOverviewModal, BillingFormData } from "@/components/checkout/BillingOverviewModal";
import { toast } from "sonner";

interface Props {
  quoteId: string;
  paymentId: string;
}

export function PaymentSuccessClient({ quoteId, paymentId }: Props) {
  const [invoiceState, setInvoiceState] = useState<"polling" | "ready" | "timed_out">("polling");
  const [billingData, setBillingData] = useState<BillingFormData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 10;

    const fetchBilling = async () => {
      try {
        const res = await fetch(`/api/quote/${quoteId}/billing`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.billingDetails && isMounted) {
            setBillingData(data.billingDetails);
          }
        }
      } catch (err) {
        console.warn("Could not fetch quote billing details:", err);
      }
    };

    fetchBilling();

    const checkInvoiceStatus = async () => {
      try {
        const res = await fetch(`/api/invoice/${quoteId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.ready && isMounted) {
            setInvoiceState("ready");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check invoice status:", err);
      }

      attempts++;
      if (attempts < maxAttempts && isMounted) {
        setTimeout(checkInvoiceStatus, 2000);
      } else if (isMounted) {
        setInvoiceState("timed_out");
      }
    };

    checkInvoiceStatus();

    return () => {
      isMounted = false;
    };
  }, [quoteId]);

  const handleSaveBilling = async (formData: BillingFormData) => {
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/quote/${quoteId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingDetails: formData }),
      });
      const data = await res.json();
      if (data.success) {
        setBillingData(data.billingDetails || formData);
        setIsEditModalOpen(false);
        toast.success("Billing and GST details updated! Your invoice PDF is refreshed.");
      } else {
        toast.error(data.error || "Failed to update billing details");
      }
    } catch (err: any) {
      console.error("Error saving billing details:", err);
      toast.error("Failed to update billing details");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const invoiceUrl = `/api/invoice/${quoteId}/download?t=${Date.now()}`;
  const whatsappInvoiceUrl = `https://wa.me/917357612865?text=${encodeURIComponent(`Hi TEAM CCTV, please send me the official Tax Invoice PDF for my booking.\n\nQuote ID: ${quoteId}\nPayment ID: ${paymentId}`)}`;
  const whatsappSupportUrl = `https://wa.me/917357612865?text=${encodeURIComponent(`Hi TEAM CCTV, I need support regarding my booking (Quote ID: ${quoteId}, Payment ID: ${paymentId}).`)}`;
  const trackUrl = `/track/${quoteId}`;
  const quoteReviewUrl = `/quote/review/${quoteId}`;

  const displayName = billingData?.is_business && billingData?.company_name
    ? billingData.company_name
    : (billingData?.customer_name || "Valued Customer");

  return (
    <div className="max-w-3xl mx-auto py-10 sm:py-16 px-4 sm:px-6 pb-20">
      <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
        
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 sm:p-10 text-center text-white">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 backdrop-blur-md">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">Payment Confirmed!</h1>
          <p className="text-emerald-100 text-sm sm:text-base font-medium">Your CCTV installation booking is locked in.</p>
        </div>

        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* Transaction & Billing Overview */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-950 text-base sm:text-lg">Booking & Billing Summary</h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white px-3 py-1 rounded-full border border-emerald-300 transition-all flex items-center gap-1 shadow-sm"
              >
                ✏️ Edit Billing / GST Info
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Quote Reference</span>
                <span className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">{quoteId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Payment ID</span>
                <span className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[200px]">{paymentId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Billed To</span>
                <span className="font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">{displayName}</span>
              </div>
              {billingData?.is_business && billingData?.gstin && (
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800">GSTIN</span>
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{billingData.gstin} (B2B Tax Invoice)</span>
                </div>
              )}
              {billingData?.address_line1 && (
                <div className="flex justify-between items-start">
                  <span className="text-emerald-800 shrink-0">Site Address</span>
                  <span className="text-right text-emerald-950 font-medium pl-4">{billingData.address_line1}, {billingData.city} {billingData.pincode}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-emerald-800">Payment Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full text-xs uppercase tracking-wider">Paid / Confirmed</span>
              </div>
            </div>
          </div>

          {/* Primary Action: View Invoice & WhatsApp PDF */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-base sm:text-lg">Tax Invoice & Billing</h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">View your official GST Tax Invoice online or receive the PDF directly on WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* View/Download Tax Invoice PDF */}
              <a 
                href={invoiceUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 px-5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm text-center"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                View Full Tax Invoice (PDF)
              </a>

              {/* Get Invoice on WhatsApp */}
              <a 
                href={whatsappInvoiceUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm text-center"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                Get Invoice PDF on WhatsApp
              </a>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 sm:p-6">
            <h3 className="font-bold text-blue-950 mb-3 text-base sm:text-lg">What Happens Next?</h3>
            <div className="space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm">1</div>
                <div>
                  <p className="font-bold text-blue-950 text-xs sm:text-sm">Engineer Assignment (Within 2 Hours)</p>
                  <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">Our nearest certified engineer will be assigned to your installation and will contact you on WhatsApp.</p>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm">2</div>
                <div>
                  <p className="font-bold text-blue-950 text-xs sm:text-sm">Site Survey & Scheduling (Within 24 Hours)</p>
                  <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">The engineer will conduct a free site survey and confirm the best camera placement for your property.</p>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm">3</div>
                <div>
                  <p className="font-bold text-blue-950 text-xs sm:text-sm">Professional Installation (Within 48 Hours)</p>
                  <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">Complete installation with testing, handover, and a walkthrough of your new CCTV system.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link 
              href="/customer/dashboard" 
              className="flex items-center justify-center gap-2 w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 py-3.5 px-4 rounded-xl font-bold transition-all text-xs sm:text-sm text-center"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Go to Customer Portal
            </Link>

            <a 
              href={whatsappSupportUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 py-3.5 px-4 rounded-xl font-bold transition-all text-xs sm:text-sm text-center"
            >
              Contact Support on WhatsApp
            </a>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="inline-block text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors">
              ← Return to Homepage
            </Link>
          </div>

        </div>
      </div>

      {/* Edit Billing & GST Details Modal */}
      {billingData && (
        <BillingOverviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onConfirmPayment={handleSaveBilling}
          initialData={billingData}
          quoteTotal={0}
          advanceAmount={0}
          mode="edit"
          isSubmitting={isSubmittingEdit}
        />
      )}
    </div>
  );
}
