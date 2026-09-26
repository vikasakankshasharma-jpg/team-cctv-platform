"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock, CreditCard, ChevronRight, FileText, CheckCircle2, ChevronLeft, Image as ImageIcon, Check, MessageCircle, Building2, Edit3, Calendar, MapPin, RefreshCw, Download, Sparkles, CheckCircle } from "lucide-react";
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
  payment_preference?: "online_all" | "cash_on_delivery";
  delivery_otp?: string;
  delivery_status?: "PENDING" | "DISPATCHED" | "DELIVERED";
  assigned_delivery_staff?: { name: string; phone: string; role: "internal" | "third_party" };
  cash_collection_status?: "PENDING" | "COLLECTED_BY_STAFF" | "SETTLED_WITH_ADMIN";
  cash_collected_amount?: number;
  assigned_installer?: { name: string; phone: string };
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

function StatusBadge({ status }: { status: QuoteData["status"] | "pending_customer_approval" }) {
  const { t } = useTranslation();
  const map = {
    pending:  { label: t("quote_awaiting", "Awaiting Approval"), classes: "bg-amber-100/50 text-amber-800 border-amber-200/50" },
    pending_customer_approval: { label: "Review Requested", classes: "bg-amber-100/50 text-amber-800 border-amber-200/50" },
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
      {(status === 'pending' || status === 'pending_customer_approval') && <Clock className="w-3.5 h-3.5" />}
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
  const [isRequestingPdf, setIsRequestingPdf] = useState(false);

  const handleRequestPdf = async () => {
    try {
      setIsRequestingPdf(true);
      const res = await fetch(`/api/quote/${quote.id}/whatsapp`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send WhatsApp");
      toast.success("Quote PDF sent to your WhatsApp successfully!");
    } catch (e) {
      toast.error("Could not send PDF right now. Please try again.");
    } finally {
      setIsRequestingPdf(false);
    }
  };

  const subtotal = quote.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = subtotal + (subtotal * quote.gstPercent / 100);
  const halfGst = (subtotal * quote.gstPercent / 100) / 2;
  const isPartiallyPaid = (quote.amount_paid || 0) > 0 && (quote.amount_due || 0) > 0;
  const advance = isPartiallyPaid && quote.amount_due ? quote.amount_due : 500;
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

  
  const redirectToPaymentLink = async (type: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi", method: "all" | "emi", returnUrlOnly = false) => {
    try {
      const backendType = (type === "advance" || type === "advance_500" || type === "advance_500_cod") ? "booking" : type;
      const toastId = toast.loading("Initializing secure payment gateway...");
      
      const res = await fetch("/api/payment/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          leadId: quote.leadId,
          paymentType: backendType
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to initialize payment", { id: toastId });
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway. Please check your connection.", { id: toastId });
        return;
      }

      toast.dismiss(toastId);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "TEAM CCTV",
        description: "Secure Checkout",
        order_id: data.orderId,
        handler: function (response: any) {
          toast.success("Payment Successful! Verifying...");
          window.location.href = `/payment-success?quoteId=${quote.id}&payment_id=${response.razorpay_payment_id}`;
        },
        prefill: {
          name: quote.customer.name,
          contact: quote.customer.phone,
          email: quote.customer.email || ""
        },
        theme: { color: "#000000" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
         toast.error(response.error.description || "Payment failed or cancelled.");
      });
      rzp.open();

    } catch (e: any) {
      toast.error("An error occurred loading the payment gateway.");
      console.error(e);
    }
  };

  const handleWhatsAppShare = async () => {
    const url = await redirectToPaymentLink("advance_500", "all", true);
    if (typeof url === "string") {
      const message = `Hi! Here is the secure payment link to confirm your CCTV installation booking: ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi">("advance_500");
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

  const openBillingModal = (type: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi") => {
    setSelectedPaymentType(type);
    setIsBillingModalOpen(true);
  };

  const handleConfirmBilling = async (formData: BillingFormData, pType: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi") => {
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

  const handlePayment = async (type: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi", method: "all" | "emi", billingOverride?: BillingFormData) => {
    if (method === "emi") setIsPayingEMI(true);
    else if (type === "full") setIsPayingFull(true);
    else setIsPayingAdvance(true);

    const activeBilling = billingOverride || billingData;

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment SDK blocked by your browser. Redirecting securely...", { duration: 5000 });
        
        const success = await redirectToPaymentLink(type, method);
        // @ts-ignore`n        if (success) return;

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
    <div className="min-h-screen bg-white sm:bg-[#F8FAFC] text-zinc-900 font-sans pb-32 sm:pb-24 selection:bg-zinc-200">
      <div className="w-full max-w-[840px] mx-auto px-0 sm:px-6 pt-0 sm:pt-6">

        {/* Top Navigation & Status Bar */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="px-4 py-3 sm:px-0 sm:py-0 flex items-center justify-between gap-2 mb-0 sm:mb-4 bg-white sm:bg-transparent border-b sm:border-0 border-zinc-100">
          {!accepted ? (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-50 sm:bg-white border border-zinc-200 rounded-full shadow-xs hover:bg-zinc-100 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-500" /> Modify Setup
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <StatusBadge status={accepted ? "accepted" : quote.status} />
            {!accepted && daysLeft > 0 && (
              <span className="text-[11px] font-semibold text-zinc-500 hidden sm:inline">
                ({daysLeft}d validity)
              </span>
            )}
            <button
              onClick={handleRequestPdf}
              disabled={isRequestingPdf}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full shadow-xs hover:bg-emerald-100 transition-all ${isRequestingPdf ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">{isRequestingPdf ? "Sending..." : "PDF on WhatsApp"}</span>
              <span className="xs:hidden">WhatsApp</span>
            </button>
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-0 sm:space-y-6">
          
          <div className="px-4 sm:px-0">
            <RevisionBanner 
              version={quote.version || 1} 
              isRevision={quote.isRevision} 
              revisionNotes={quote.revisionNotes} 
            />
          </div>

          {/* High-Impact Hero Quotation Card (Edge-to-Edge on Mobile) */}
          <motion.div variants={fadeIn} className="relative rounded-none sm:rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-7 shadow-none sm:shadow-xl border-y sm:border border-blue-900/40 overflow-hidden">
            {/* Ambient Backlight */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> Official Quotation
                  </span>
                  <span className="text-xs text-blue-200 font-mono font-medium">#{quote.quoteNumber}</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> 14-Day Price Lock
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200/80">Total All-Inclusive Estimate</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">{formatINR(total)}</span>
                    <span className="text-xs text-emerald-400 font-semibold">Incl. 18% GST</span>
                  </div>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pay token of <strong>₹500</strong> to book installation slot</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs min-w-[210px]">
                  <div className="flex items-center justify-between text-slate-300 text-[10px] uppercase tracking-wider font-semibold">
                    <span>Customer Details</span>
                    <button
                      onClick={() => openBillingModal("advance_500")}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-bold"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit
                    </button>
                  </div>
                  <p className="font-bold text-white text-sm mt-0.5 truncate">
                    {billingData.is_business && billingData.company_name ? billingData.company_name : (billingData.customer_name || quote.customer.name)}
                  </p>
                  <p className="text-slate-300 text-[11px] truncate mt-0.5">
                    {billingData.address_line1 ? `${billingData.address_line1}, ${billingData.city}` : quote.installationAddress}
                  </p>
                  {billingData.is_business && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      GST: {billingData.gstin || 'Registered'}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-5 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-slate-200">
                <div className="flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center justify-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>1-Yr Warranty</span>
                </div>
                <div className="flex items-center justify-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>2-3 Days Setup</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Itemized Bill of Materials (Edge-to-Edge on Mobile) */}
          <motion.div variants={fadeIn} className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-sm border-b sm:border border-zinc-200/80 p-4 sm:p-7">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {t("bill_of_materials", "Itemized Bill of Materials")}
                </h3>
                <p className="text-[11px] text-zinc-500">{quote.lineItems.length} verified components & services</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3 text-zinc-600" />
                <span>PDF</span>
              </button>
            </div>

            {/* Mobile-friendly card layout replacing table */}
            <div className="space-y-3">
              {quote.lineItems.map((item, idx) => {
                const cleanDescription = (item.description || "").replace(/Camera type: undefined \| /g, "");
                return (
                  <div key={item.id || idx} className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">#{idx + 1}</span>
                          {item.name}
                        </h4>
                        {cleanDescription && (
                          <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
                            {cleanDescription}
                          </p>
                        )}
                        {item.badge && (
                          <span
                            className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide border"
                            style={{
                              backgroundColor: item.badge.color ? `${item.badge.color}15` : '#f4f4f5',
                              color: item.badge.color || '#52525b',
                              borderColor: item.badge.color ? `${item.badge.color}30` : '#e4e4e7'
                            }}
                          >
                            {item.badge.label}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-full shrink-0">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-4">
                      <span className="text-zinc-500">Unit Price</span>
                      <span className="font-semibold">{formatINR(item.unitPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-zinc-50">
                      <span className="text-zinc-500">Subtotal</span>
                      <span className="font-bold text-zinc-900">{formatINR(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Breakdown Card */}
            <div className="mt-5 pt-4 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[11px] text-zinc-500 space-y-1">
                <p>• Prices include standard cabling and professional on-site installation.</p>
                <p>• GST 18% computed on taxable equipment and labor value.</p>
                {quote.notes && (
                  <p className="text-zinc-600 font-medium">Note: {quote.notes} {quote.companyGstin && `| GSTIN: ${quote.companyGstin}`}</p>
                )}
              </div>

              <div className="w-full sm:w-72 bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Taxable Subtotal</span>
                  <span className="font-semibold text-zinc-900">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>CGST ({quote.gstPercent / 2}%)</span>
                  <span>{formatINR(halfGst)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 pb-2 border-b border-zinc-200">
                  <span>SGST ({quote.gstPercent / 2}%)</span>
                  <span>{formatINR(halfGst)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-zinc-900">{t("total", "Grand Total")}</span>
                  <span className="text-lg font-black tracking-tight text-blue-950">{formatINR(total)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-zinc-200 text-emerald-700 font-bold text-[11px]">
                  <span>Booking Advance Due</span>
                  <span className="text-xs font-black">{formatINR(advance)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visual Comparison (Edge-to-Edge on Mobile) */}
          <motion.div variants={fadeIn} className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-sm border-b sm:border border-zinc-100 p-4 sm:p-8">
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
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 px-4 sm:px-0 py-2 sm:py-0">
            <TermCard icon={<ShieldCheck className="w-5 h-5" />} title="1-Year Warranty" body="Complete equipment and labour coverage. Free replacement for any defective parts." delay={0.1} />
            <TermCard icon={<CreditCard className="w-5 h-5" />} title={`Flat ₹500 Advance`} body={`${formatINR(advance)} required to initiate the project. 90% on delivery, 10% after completion.`} delay={0.2} />
            <TermCard icon={<Clock className="w-5 h-5" />} title="Priority Support" body="Free remote assistance for 12 months. Next-business-day on-site support." delay={0.3} />
          </motion.div>

          {/* Dual Action / Next Steps Section */}
          <motion.div variants={fadeIn} id="payment-section" className="pt-0 sm:pt-4">
            {!accepted ? (
              <div className="space-y-4 sm:space-y-6">
                
                {/* Main Action Box (Edge-to-Edge on Mobile) */}
                <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-10 shadow-none sm:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-y sm:border border-zinc-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-900">How Would You Like to Proceed?</h3>
                      <p className="text-xs sm:text-sm text-zinc-500">Lock your installation immediately with advance or schedule a free physical site survey first.</p>
                    </div>
                  </div>

                  
                    {/* 3-Plan Checkout Experience */}
                    <div className="mb-8">
                      <div className="text-center mb-6">
                         <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-2">Choose Your Payment Plan</h3>
                         <p className="text-sm text-zinc-500 dark:text-zinc-400">Select how you'd like to pay for your security system.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* Option 1: Standard Milestone (Recommended / Lowest Upfront) */}
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 flex flex-col justify-between shadow-sm group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                              Recommended 🌟
                            </span>
                          </div>
                          
                          <div>
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="text-lg font-black text-emerald-950">Milestone Plan</h4>
                              <span className="text-xs font-bold text-emerald-700">₹500 Today</span>
                            </div>
                            <p className="text-xs text-emerald-900/70 leading-relaxed mb-4">
                              Lowest upfront friction. Pay just ₹500 booking token now, 90% at material delivery, and 10% after successful installation.
                            </p>
                            
                            <div className="space-y-2 text-xs text-zinc-700 bg-white/70 rounded-xl p-3 mb-5 border border-emerald-100">
                              <div className="flex items-center justify-between border-b border-emerald-100/70 pb-1">
                                <span className="font-medium">1. Booking Token:</span>
                                <span className="font-black text-emerald-700">₹500</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-emerald-100/70 pb-1">
                                <span className="font-medium">2. At Delivery (90%):</span>
                                <span className="font-bold text-zinc-900">₹{Math.round((total - 500) * 0.90).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="font-medium">3. Post-Setup (10%):</span>
                                <span className="font-bold text-zinc-900">₹{Math.round((total - 500) * 0.10).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openBillingModal("advance_500")}
                            disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            Book with ₹500 Advance
                          </button>
                        </div>

                        {/* Option 2: Smart Pay (Full Discount) */}
                        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between hover:border-zinc-300 transition-all">
                          <div>
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="text-lg font-black text-zinc-900">Smart Pay</h4>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Save 2%</span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                              Pay 100% upfront securely online and get a flat 2% instant discount on your total quotation.
                            </p>
                            
                            <div className="bg-white rounded-xl p-3 mb-5 border border-zinc-200/80 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-500">Regular Total:</span>
                                <span className="text-zinc-400 line-through">₹{total.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-zinc-900">Discounted:</span>
                                <span className="text-sm font-black text-emerald-600">₹{Math.round(total * 0.98).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 text-right">
                                Instant Savings: ₹{Math.round(total * 0.02).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openBillingModal("full_discount")}
                            disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                            className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4 text-zinc-300" />
                            Pay ₹{Math.round(total * 0.98).toLocaleString('en-IN')}
                          </button>
                        </div>
                        
                        {/* Option 3: Flexi EMI */}
                        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between hover:border-zinc-300 transition-all">
                          <div>
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="text-lg font-black text-zinc-900">Flexi EMI</h4>
                              <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">Easy EMIs</span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                              Convert your payment into easy monthly instalments. No Cost EMI available on major credit cards.
                            </p>
                            
                            <div className="space-y-2 text-xs text-zinc-600 mb-5 bg-white rounded-xl p-3 border border-zinc-200/80">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Zero foreclosure charges</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Instant bank approval</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Up to 12 months tenure</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openBillingModal("emi")}
                            disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            {isPayingEMI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4 text-zinc-600" />}
                            View EMI Options
                          </button>
                        </div>

                      </div>
                      
                      {/* Free Physical Site Survey Banner */}
                      <div className="mt-6 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-purple-950">Want an engineer to inspect your premises first?</p>
                            <p className="text-[11px] text-purple-700">Schedule a 100% Free Physical Site Survey with zero obligations before paying anything.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsSurveyModalOpen(true)}
                          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-all shrink-0 active:scale-95 shadow-xs"
                        >
                          Book Free Survey
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 pt-2">
                    <button 
                      onClick={() => redirectToPaymentLink("advance_500", "all")}
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
                className="bg-emerald-500 text-white rounded-3xl p-4 md:p-8 sm:p-10 text-center shadow-xl shadow-emerald-500/20"
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

      {/* Mobile-Friendly Sticky Bottom Bar */}
      {!accepted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-1.5 max-w-lg mx-auto">
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Booking Token</span>
              <span className="text-base font-black text-emerald-600 tracking-tight leading-none">{formatINR(advance)}</span>
              <span className="text-[10px] text-zinc-500 mt-0.5 truncate">Total: {formatINR(total)}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsSurveyModalOpen(true)}
                className="flex items-center justify-center gap-1 px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all active:scale-95"
                title="Schedule Free Physical Survey"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span className="hidden xs:inline">Survey</span>
              </button>

              <button
                onClick={() => openBillingModal("advance_500")}
                disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pay ₹500</span>
              </button>

              <button
                onClick={handleRequestPdf}
                disabled={isRequestingPdf}
                className={`flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0 ${isRequestingPdf ? "opacity-70 cursor-not-allowed" : ""}`}
                title="Send Quote to WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </button>
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

