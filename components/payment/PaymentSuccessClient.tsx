"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { BillingOverviewModal, BillingFormData } from "@/components/checkout/BillingOverviewModal";
import { toast } from "sonner";

interface Props {
  quoteId: string;
  paymentId: string;
}

export function PaymentSuccessClient({ quoteId, paymentId }: Props) {
  const { t } = useTranslation();
  const [invoiceState, setInvoiceState] = useState<"polling" | "ready" | "timed_out">("polling");
  const [statusData, setStatusData] = useState<{
    is_advance?: boolean;
    amount_paid?: number;
    amount_due?: number;
    total_payable?: number;
    status?: string;
    payment_status?: string;
  } | null>(null);
  const [billingData, setBillingData] = useState<BillingFormData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 10;

    const fetchBilling = async () => {
      try {
        // Fallback webhook trigger
        if (paymentId) {
           await fetch("/api/payment/verify", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ quoteId, paymentId })
           }).catch(() => {});
        }
        
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
          if (isMounted) {
            setStatusData(data);
          }
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

  const isAdvance = Boolean(
    statusData?.is_advance || 
    statusData?.status === "BOOKED" || 
    statusData?.payment_status === "advance_paid" || 
    (statusData?.amount_due && statusData.amount_due > 0)
  );

  const paidAmount = statusData?.amount_paid || (isAdvance ? 500 : 0);
  const dueAmount = statusData?.amount_due || (isAdvance && statusData?.total_payable ? Math.max(0, statusData.total_payable - paidAmount) : 0);

  const invoiceUrl = `/api/invoice/${quoteId}/download?t=${Date.now()}`;
  const whatsappInvoiceUrl = `https://wa.me/917357612865?text=${encodeURIComponent(`Hi TEAM CCTV, please send me the official ${isAdvance ? 'Advance Booking Receipt' : 'Tax Invoice'} PDF for my booking.\n\nQuote ID: ${quoteId}\n{t("ps_payment_id")}: ${paymentId}`)}`;
  const whatsappSupportUrl = `https://wa.me/917357612865?text=${encodeURIComponent(`Hi TEAM CCTV, I need support regarding my booking (Quote ID: ${quoteId}, {t("ps_payment_id")}: ${paymentId}).`)}`;
  const trackUrl = `/track/${quoteId}`;
  const quoteReviewUrl = `/quote/review/${quoteId}`;

  const displayName = billingData?.is_business && billingData?.company_name
    ? billingData.company_name
    : (billingData?.customer_name || "Valued Customer");

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-10 sm:py-16 px-4 sm:px-6 pb-20">
      <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
        
        {/* Success Header */}
        <div className={`p-4 md:p-8 sm:p-10 text-center text-white ${isAdvance ? 'bg-gradient-to-r from-amber-600 to-orange-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 backdrop-blur-md">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">
            {isAdvance ? t("ps_booking_confirmed") : t("ps_payment_confirmed")}
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium">
            {isAdvance 
              ? `₹${paidAmount.toLocaleString('en-IN')} Advance Received. Your CCTV installation slot is reserved.`
              : "Your CCTV installation booking is locked in."}
          </p>
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
                ✏️ {t("ps_edit_billing_gst")}
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">{t("ps_quote_reference")}</span>
                <span className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">{quoteId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">{t("ps_payment_id")}</span>
                <span className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[200px]">{paymentId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">{t("ps_billed_to")}</span>
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
                  <span className="text-emerald-800 shrink-0">{t("ps_site_address")}</span>
                  <span className="text-right text-emerald-950 font-medium pl-4">{billingData.address_line1}, {billingData.city} {billingData.pincode}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-emerald-800">{t("ps_payment_status")}</span>
                {isAdvance ? (
                  <span className="font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-full text-xs uppercase tracking-wider">
                    {t("ps_advance_paid_cod", "", {
                      advance: "₹" + paidAmount.toLocaleString('en-IN'),
                      cod: dueAmount > 0 ? t("ps_cod_balance", "", { due: "₹" + dueAmount.toLocaleString('en-IN') }) : ""
                    })}
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full text-xs uppercase tracking-wider">
                    {t("ps_paid_confirmed")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action: View Invoice & WhatsApp PDF */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-base sm:text-lg">
                {isAdvance ? t("ps_advance_receipt_billing") : t("ps_tax_invoice_billing")}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                {isAdvance 
                  ? t("ps_view_advance_receipt_desc")
                  : t("ps_view_tax_invoice_desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* View/Download Tax Invoice or Booking Receipt PDF */}
              <a 
                href={invoiceUrl} 
                className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 px-5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm text-center"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {isAdvance ? t("ps_download_booking_receipt") : t("ps_download_tax_invoice")}
              </a>

              {/* Get Invoice / Receipt on WhatsApp */}
              <a 
                href={whatsappInvoiceUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm text-center"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                {isAdvance ? t("ps_get_receipt_wa") : t("ps_get_invoice_wa")}
              </a>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 sm:p-6">
            <h3 className="font-bold text-blue-950 mb-3 text-base sm:text-lg">{t("ps_what_happens_next")}</h3>
            <div className="space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm">1</div>
                <div>
                  <p className="font-bold text-blue-950 text-xs sm:text-sm">{t("ps_engineer_assignment")}</p>
                  <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">{t("ps_engineer_assignment_desc")}</p>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm">2</div>
                <div>
                  <p className="font-bold text-blue-950 text-xs sm:text-sm">{t("ps_site_survey_scheduling")}</p>
                  <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">{t("ps_site_survey_desc")}</p>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm">3</div>
                <div>
                  <p className="font-bold text-blue-950 text-xs sm:text-sm">{t("ps_professional_installation")}</p>
                  <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">{t("ps_professional_installation_desc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Actions - Massive Dashboard CTA */}
          <div className="pt-4">
            <Link 
              href="/customer/dashboard" 
              className="group relative flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 sm:py-5 px-6 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
              <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-sm sm:text-base tracking-wide">Track Booking & Go To Dashboard</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-5 pb-2">
            <a 
              href={whatsappSupportUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              {t("ps_contact_support_wa")}
            </a>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors">
              {t("ps_return_homepage")}
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
