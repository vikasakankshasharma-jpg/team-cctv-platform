"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock, CreditCard, ChevronRight, FileText, CheckCircle2, ChevronLeft, Image as ImageIcon, Check, MessageCircle, Building2, Edit3, Calendar, MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { RevisionBanner } from "@/components/quote/RevisionBanner";
import { BillingOverviewModal, BillingFormData } from "@/components/checkout/BillingOverviewModal";
import { SiteVisitBookingModal } from "@/components/checkout/SiteVisitBookingModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  name: string;
  description: string;
  badge?: { label: string; color?: string };
  quantity: number;
  unitPrice: number;
}

export interface QuoteData {
  id: string;
  leadId: string;
  quoteNumber: string;
  version?: number;
  isRevision?: boolean;
  revisionNotes?: string;
  status: "pending" | "accepted" | "expired" | "rejected" | "PARTIAL_PAID" | "PAID";
  issuedAt: string;
    amount_paid?: number;
    amount_due?: number;
  validUntil: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  installationAddress: string;
  propertyType: string;
  propertyDetail: string;
  siteVisitDate?: string;
  lineItems: LineItem[];
  gstPercent: number;
  notes?: string;
  advancePercent: number;
  companyGstin: string;
  billing_details?: Partial<BillingFormData>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteData["status"] }) {
  const { t } = useTranslation();
  const map = {
    pending:  { label: t("quote_awaiting", "Awaiting Approval"), classes: "bg-amber-100/50 text-amber-800 border-amber-200/50" },
    accepted: { label: t("quote_accepted", "Accepted"),          classes: "bg-emerald-100/50 text-emerald-800 border-emerald-200/50" },
    expired:  { label: t("quote_expired", "Expired"),           classes: "bg-rose-100/50 text-rose-800 border-rose-200/50" },
    rejected: { label: t("quote_rejected", "Rejected"),          classes: "bg-zinc-100/50 text-zinc-600 border-zinc-200/50" },
      PARTIAL_PAID: { label: "Partially Paid", classes: "bg-indigo-100/50 text-indigo-800 border-indigo-200/50" },
      PAID: { label: "Fully Paid", classes: "bg-emerald-100/50 text-emerald-800 border-emerald-200/50" },
  };
  const s = map[status] || map.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border backdrop-blur-sm ${s.classes}`}>
      {status === 'accepted' && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status === 'pending' && <Clock className="w-3.5 h-3.5" />}
      {s.label}
    </span>
  );
}

function TermCard({ icon, title, body, delay }: { icon: React.ReactNode; title: string; body: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white/60 backdrop-blur-xl border border-zinc-200/60 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h4>
        <p className="text-xs text-zinc-500 leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────

export function QuoteReviewClient({ quote }: { quote: QuoteData }) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(quote.status === "accepted");
  const [isPayingEMI, setIsPayingEMI] = useState(false);
  const [isPayingFull, setIsPayingFull] = useState(false);
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);

  const subtotal = quote.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = subtotal + (subtotal * quote.gstPercent / 100);
  const halfGst = (subtotal * quote.gstPercent / 100) / 2;
  const isPartiallyPaid = (quote.amount_paid || 0) > 0 && (quote.amount_due || 0) > 0;
  const advance = isPartiallyPaid && quote.amount_due ? quote.amount_due : Math.round(total * (quote.advancePercent / 100));
  const daysLeft = daysUntil(quote.validUntil);

  const loadRazorpayScript = async (retries = 2): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      const success = await new Promise<boolean>((resolve) => {
        if (typeof window !== "undefined" && (window as any).Razorpay) {
          resolve(true);
          return;
        }
        
        let timeout: NodeJS.Timeout;
        
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) existing.remove();
        
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        
        script.onload = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        
        document.body.appendChild(script);
        
        // Timeout after 4 seconds
        timeout = setTimeout(() => {
          resolve(false);
        }, 4000);
      });
      
      if (success) return true;
      // Wait briefly before retrying
      if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
    }
    return false;
  };

  const redirectToPaymentLink = async (type: "advance" | "full", method: "all" | "emi", returnUrlOnly = false) => {
    try {
      const toastId = toast.loading("Generating secure payment page...");
      const res = await fetch("/api/payment/razorpay-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          leadId: quote.leadId,
          paymentType: type,
          notes: {
            customer_name: quote.customer.name,
            customer_phone: quote.customer.phone,
            payment_type: type,
            payment_method: method
          }
        }),
      });
      const data = await res.json();
      toast.dismiss(toastId);
      
      if (data.success && data.payment_url) {
        if (returnUrlOnly) return data.payment_url;
        window.location.href = data.payment_url;
        return true;
      }
      return false;
    } catch (e) {
      console.error("Payment Link fallback failed", e);
      return false;
    }
  };

  const handleWhatsAppShare = async () => {
    const url = await redirectToPaymentLink("advance", "all", true);
    if (typeof url === "string") {
      const message = `Hi! Here is the secure payment link to confirm your CCTV installation booking: ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"advance" | "full">("advance");
  const [isSubmittingBilling, setIsSubmittingBilling] = useState(false);
  const [billingData, setBillingData] = useState<BillingFormData>({
    is_business: Boolean(quote.billing_details?.is_business || (quote.companyGstin && quote.companyGstin !== "08AABCT1234A1ZS")),
    company_name: quote.billing_details?.company_name || "",
    gstin: quote.billing_details?.gstin || (quote.companyGstin && quote.companyGstin !== "08AABCT1234A1ZS" ? quote.companyGstin : ""),
    customer_name: quote.billing_details?.customer_name || quote.customer.name || "",
    phone: quote.billing_details?.phone || quote.customer.phone || "",
    email: quote.billing_details?.email || quote.customer.email || "",
    address_line1: quote.billing_details?.address_line1 || quote.installationAddress || "",
    address_line2: quote.billing_details?.address_line2 || "",
    city: quote.billing_details?.city || "Jaipur",
    state: quote.billing_details?.state || "Rajasthan",
    state_code: quote.billing_details?.state_code || "08",
    pincode: quote.billing_details?.pincode || "",
  });

  const openBillingModal = (type: "advance" | "full") => {
    setSelectedPaymentType(type);
    setIsBillingModalOpen(true);
  };

  const handleConfirmBilling = async (formData: BillingFormData, pType: "advance" | "full") => {
    setIsSubmittingBilling(true);
    try {
      await fetch(`/api/quote/${quote.id}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingDetails: formData }),
      });
      setBillingData(formData);
      setIsBillingModalOpen(false);
      await handlePayment(pType, "all", formData);
    } catch (e) {
      console.error("Billing submit error:", e);
      toast.error("Failed to save billing details. Proceeding with payment...");
      setIsBillingModalOpen(false);
      await handlePayment(pType, "all", formData);
    } finally {
      setIsSubmittingBilling(false);
    }
  };

  const handlePayment = async (type: "advance" | "full", method: "all" | "emi", billingOverride?: BillingFormData) => {
    if (method === "emi") setIsPayingEMI(true);
    else if (type === "full") setIsPayingFull(true);
    else setIsPayingAdvance(true);

    const activeBilling = billingOverride || billingData;

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment SDK blocked by your browser. Redirecting securely...", { duration: 5000 });
        
        const success = await redirectToPaymentLink(type, method);
        if (success) return;

        toast.error("Could not load payment gateway. Please disable your ad-blocker or try a different browser.");
        if (method === "emi") setIsPayingEMI(false);
        else if (type === "full") setIsPayingFull(false);
        else setIsPayingAdvance(false);
        return;
      }

      const res = await fetch("/api/payment/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          leadId: quote.leadId,
          paymentType: type,
          billingDetails: activeBilling,
          notes: {
            customer_name: activeBilling.customer_name || quote.customer.name,
            customer_phone: activeBilling.phone || quote.customer.phone,
            company_name: activeBilling.company_name || "",
            gstin: activeBilling.gstin || "",
            payment_type: type,
            payment_method: method
          }
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "TEAM CCTV",
        description: `Security System Installation (${type === "advance" ? "Advance Booking" : "Full Payment"})`,
        order_id: data.order.id,
        prefill: {
          name: activeBilling.customer_name || quote.customer.name,
          contact: activeBilling.phone || quote.customer.phone,
          email: activeBilling.email || quote.customer.email || "",
        },
        theme: {
          color: "#0F172A",
        },
        handler: async function (response: any) {
          toast.success("Payment confirmed! Scheduling installation...");
          setAccepted(true);
          window.location.href = `/payment-success?quoteId=${quote.id}&paymentId=${response.razorpay_payment_id}`;
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment window closed.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Payment initiation failed");
      console.error(err);
    } finally {
      setIsPayingEMI(false);
      setIsPayingFull(false);
      setIsPayingAdvance(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info("Generating your PDF...");
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      const pdfRes = await fetch(`/api/v1/leads/${quote.leadId}/quotes/${quote.id}/pdf`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (pdfRes.ok) {
        const contentType = pdfRes.headers.get("Content-Type");
        if (contentType === "application/pdf") {
          const blob = await pdfRes.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        } else {
          const { url } = await pdfRes.json();
          if (url) {
            window.open(url, "_blank");
          }
        }
      } else {
         toast.error("Failed to generate PDF.");
      }
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error("An error occurred while downloading the PDF.");
    }
  };

  // Animation variants
  const fadeIn: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
  const staggerContainer: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 font-sans pb-36 md:pb-24 selection:bg-zinc-200">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20">

        {/* Top Actions & Status */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            {!accepted && (
              <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900 bg-white sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-full border sm:border-0 shadow-sm sm:shadow-none transition-colors">
                <ChevronLeft className="w-4 h-4" /> Modify Configuration
              </button>
            )}
            <div className="flex items-center gap-2">
              <StatusBadge status={accepted ? "accepted" : quote.status} />
              {!accepted && daysLeft > 0 && (
                <span className="text-[11px] sm:text-xs font-medium text-zinc-500 tracking-wide">
                  ({daysLeft}d left)
                </span>
              )}
            </div>
          </div>
          
          <a 
            href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "917357612865"}?text=${encodeURIComponent(`Hi TEAM CCTV, please send me the official PDF for my Quote ID: ${quote.id}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50/80 sm:bg-white border border-emerald-200 rounded-xl sm:rounded-full shadow-sm hover:bg-emerald-100 hover:shadow transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Get PDF on WhatsApp
          </a>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          
          <RevisionBanner 
            version={quote.version || 1} 
            isRevision={quote.isRevision} 
            revisionNotes={quote.revisionNotes} 
          />

          {/* Main Quote Document */}
          <motion.div variants={fadeIn} className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-6 sm:px-10 sm:py-10 bg-white border-b border-zinc-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-1">{t("quotation", "Quotation")}</h1>
                  <p className="text-zinc-400 font-semibold tracking-wide text-xs sm:text-sm">#{quote.quoteNumber}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-bold text-zinc-900 text-sm sm:text-base">TEAM CCTV</div>
                  <div className="text-zinc-500 text-xs sm:text-sm mt-0.5">Smart Security Solutions</div>
                  <div className="text-zinc-400 text-[11px] sm:text-xs">Jaipur, Rajasthan</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-10 pt-4 sm:pt-0 border-t border-zinc-50 sm:border-0">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Date</p>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900">{formatDate(quote.issuedAt)}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Billed To</p>
                    <button
                      onClick={() => openBillingModal("advance")}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                    {billingData.is_business && billingData.company_name ? billingData.company_name : (billingData.customer_name || quote.customer.name)}
                  </p>
                  {billingData.is_business && (
                    <span className="inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      GST: {billingData.gstin || 'Registered'}
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Site / Billing Address</p>
                    <button
                      onClick={() => openBillingModal("advance")}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Change
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                    {billingData.address_line1 ? `${billingData.address_line1}, ${billingData.city} ${billingData.pincode}` : quote.installationAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill of Materials */}
            <div className="px-4 py-6 sm:px-10 sm:py-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">{t("bill_of_materials", "Bill of Materials")}</h3>
                <span className="text-[11px] text-zinc-400 sm:hidden">Scroll table horizontally →</span>
              </div>
              
              <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[480px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="pb-3 text-xs font-semibold text-zinc-400 w-3/5">Description</th>
                      <th className="pb-3 text-xs font-semibold text-zinc-400 text-center w-1/12">Qty</th>
                      <th className="pb-3 text-xs font-semibold text-zinc-400 text-right w-1/6">Rate</th>
                      <th className="pb-3 text-xs font-semibold text-zinc-400 text-right w-1/6">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {quote.lineItems.map((item) => (
                      <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 pr-3">
                          <p className="text-xs sm:text-sm font-semibold text-zinc-900">{item.name}</p>
                          <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.description}</p>
                          {item.badge && (
                            <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border"
                                  style={{ backgroundColor: item.badge.color ? `${item.badge.color}15` : '#f4f4f5', color: item.badge.color || '#52525b', borderColor: item.badge.color ? `${item.badge.color}30` : '#e4e4e7' }}>
                              {item.badge.label}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center text-xs sm:text-sm font-medium text-zinc-700">{item.quantity}</td>
                        <td className="py-4 text-right text-xs sm:text-sm text-zinc-500">{formatINR(item.unitPrice)}</td>
                        <td className="py-4 text-right text-xs sm:text-sm font-bold text-zinc-900">{formatINR(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mt-6 sm:mt-8 pt-4 border-t border-zinc-100">
                <div className="w-full sm:w-64 space-y-2.5">
                  <div className="flex justify-between text-xs sm:text-sm text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-900">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs text-zinc-500">
                    <span>CGST ({quote.gstPercent / 2}%)</span>
                    <span>{formatINR(halfGst)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs text-zinc-500 pb-3 border-b border-zinc-100">
                    <span>SGST ({quote.gstPercent / 2}%)</span>
                    <span>{formatINR(halfGst)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm sm:text-base font-bold text-zinc-900">{t("total", "Total")}</span>
                    <span className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">{formatINR(total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Notes */}
            {quote.notes && (
              <div className="px-5 py-4 sm:px-10 sm:py-6 bg-zinc-50/80 border-t border-zinc-100">
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Notes</p>
                <p className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed">{quote.notes} {quote.companyGstin && `| GSTIN: ${quote.companyGstin}`}</p>
              </div>
            )}
          </motion.div>

          {/* Visual Comparison */}
          <motion.div variants={fadeIn} className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 p-5 sm:p-10">
             <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800"><ImageIcon className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Resolution Clarity Comparison</h3>
                  <p className="text-xs text-zinc-500">Visualizing the difference in detail capture.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video group">
                 <Image src="/comparisons/2mp.png" alt="2MP View" width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                 <div className="absolute bottom-0 left-0 p-3 sm:p-4">
                   <p className="text-white text-xs sm:text-sm font-bold">2MP Full HD</p>
                   <p className="text-white/70 text-[10px] sm:text-xs mt-0.5">Standard identification (10-15ft)</p>
                 </div>
               </div>
               
               <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 aspect-video group shadow-lg shadow-emerald-500/10">
                 <Image src="/comparisons/5mp.png" alt="5MP View" width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                 <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Recommended</div>
                 <div className="absolute bottom-0 left-0 p-3 sm:p-4">
                   <p className="text-white text-xs sm:text-sm font-bold">5MP Ultra 3K HD</p>
                   <p className="text-white/80 text-[10px] sm:text-xs mt-0.5">Advanced identification (25-30ft)</p>
                 </div>
               </div>
             </div>
          </motion.div>

          {/* Value Propositions */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <TermCard icon={<ShieldCheck className="w-5 h-5" />} title="1-Year Warranty" body="Complete equipment and labour coverage. Free replacement for any defective parts." delay={0.1} />
            <TermCard icon={<CreditCard className="w-5 h-5" />} title={`${quote.advancePercent}% Advance`} body={`${formatINR(advance)} required to initiate the project. Balance upon successful handover.`} delay={0.2} />
            <TermCard icon={<Clock className="w-5 h-5" />} title="Priority Support" body="Free remote assistance for 12 months. Next-business-day on-site support." delay={0.3} />
          </motion.div>

          {/* Dual Action / Next Steps Section */}
          <motion.div variants={fadeIn} id="payment-section" className="pt-2 sm:pt-4">
            {!accepted ? (
              <div className="space-y-6">
                
                {/* Main Action Box */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-900">How Would You Like to Proceed?</h3>
                      <p className="text-xs sm:text-sm text-zinc-500">Lock your installation immediately with advance or schedule a free physical site survey first.</p>
                    </div>
                  </div>

                  {/* 2-Column Decision Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    
                    {/* Track 1: Online Advance Booking */}
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col justify-between border border-slate-800 shadow-md">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                            Fast Track Installation
                          </span>
                          <span className="text-xs font-bold text-slate-400">Step 1 of 2</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-1">Confirm & Pay Advance</h4>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                          Pay {formatINR(advance)} advance now. Equipment is locked from warehouse and certified engineer dispatched within 24-48 hours.
                        </p>
                        <div className="space-y-1.5 text-[11px] text-slate-300 mb-5">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Instant GST Tax Invoice</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Priority technician allocation</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {isPartiallyPaid ? <span>Total Remaining Balance Due</span> : <span>Remaining balance due on site completion</span>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => openBillingModal("advance")}
                          disabled={isPayingAdvance || isPayingFull}
                          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay {isPartiallyPaid ? "Balance " : "Advance "}{formatINR(advance)}
                        </button>

                        <button
                          onClick={() => openBillingModal("full")}
                          disabled={isPayingAdvance || isPayingFull}
                          className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-[11px] transition-all text-center"
                        >
                          Or Pay Full Amount ({formatINR(total)})
                        </button>
                      </div>
                    </div>

                    {/* Track 2: Physical Site Survey */}
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-50/70 to-indigo-50/70 text-slate-900 flex flex-col justify-between border-2 border-purple-200/80 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200/70 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full">
                            100% Free Consultation
                          </span>
                          <span className="text-xs font-bold text-purple-600">No Advance</span>
                        </div>
                        <h4 className="text-base font-bold text-purple-950 mb-1">Book Free Site Survey</h4>
                        <p className="text-xs text-purple-900/80 leading-relaxed mb-4">
                          Want an engineer to inspect your site first? Pick a convenient time slot. Our technician will visit, check blindspots, and measure wiring.
                        </p>
                        <div className="space-y-1.5 text-[11px] text-purple-900/90 mb-5">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Physical site inspection by CCTV specialist</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Zero obligation / No advance payment today</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Pick your preferred Date & Time Slot</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsSurveyModalOpen(true)}
                        className="w-full py-3.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Calendar className="w-4 h-4" />
                        📅 Book Free Site Survey
                      </button>
                    </div>

                  </div>

                  {/* Cashfree EMI Banner */}
                  <div className="relative bg-zinc-900 rounded-2xl p-5 sm:p-6 overflow-hidden mb-5 group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-1000 group-hover:scale-110" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Easy EMI</span>
                            <span className="text-xs text-zinc-400 font-medium">Credit & Debit Card EMI</span>
                          </div>
                         <h4 className="text-sm sm:text-base font-bold text-white mb-0.5">Split into Easy Monthly Instalments</h4>
                         <p className="text-xs text-zinc-400">No-cost EMI available on major cards. Zero foreclosure charges.</p>
                       </div>
                       
                       <motion.button
                         whileTap={{ scale: 0.98 }}
                         onClick={() => openBillingModal("full")}
                         disabled={isPayingEMI}
                         className="shrink-0 w-full md:w-auto px-5 py-3 bg-white text-zinc-900 text-xs sm:text-sm font-bold rounded-xl shadow-lg hover:bg-zinc-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                       >
                         {isPayingEMI ? "Processing..." : "Apply for EMI"}
                       </motion.button>
                     </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2 pt-2">
                    <button 
                      onClick={() => redirectToPaymentLink("advance", "all")}
                      className="text-xs text-zinc-500 hover:text-blue-600 underline underline-offset-2 transition-colors text-center"
                    >
                      Trouble with the payment window? Click here to pay securely.
                    </button>
                    <button 
                      onClick={handleWhatsAppShare}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors flex items-center gap-1.5 pt-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send Payment Link via WhatsApp (Alternate Device)
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-emerald-500 text-white rounded-3xl p-8 sm:p-10 text-center shadow-xl shadow-emerald-500/20"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Quote Accepted & Paid!</h3>
                <p className="text-emerald-50 font-medium text-sm">Thank you for choosing TEAM CCTV. Our dispatch team will contact you shortly to schedule your installation.</p>
              </motion.div>
            )}
          </motion.div>

        </motion.div>
      </div>

      {/* Mobile-Friendly Sticky Bottom Bar (Sleek, Non-Obtrusive) */}
      {!accepted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
              <span className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">{formatINR(total)}</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Adv: {formatINR(advance)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsSurveyModalOpen(true)}
                className="flex items-center justify-center gap-1 px-3 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                Free Survey
              </button>

              <button
                onClick={() => openBillingModal("advance")}
                disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay {formatINR(advance)}
              </button>

              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "917357612865"}?text=${encodeURIComponent(`Hi TEAM CCTV, please send me the official PDF for my Quote ID: ${quote.id}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
                title="WhatsApp PDF"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Billing & GST Overview Modal */}
      <BillingOverviewModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        onConfirmPayment={handleConfirmBilling}
        initialData={billingData}
        quoteTotal={total}
        advanceAmount={advance}
        paymentType={selectedPaymentType}
        isSubmitting={isSubmittingBilling}
      />

      {/* Free Site Survey Booking Modal */}
      <SiteVisitBookingModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        leadId={quote.leadId}
        quoteId={quote.id}
        customerName={billingData.customer_name || quote.customer.name}
        customerMobile={billingData.phone || quote.customer.phone}
        initialAddress={billingData.address_line1 || quote.installationAddress}
        onBookingSuccess={() => {
          toast.success("Survey request registered! Our team will contact you.");
        }}
      />
    </div>
  );
}
