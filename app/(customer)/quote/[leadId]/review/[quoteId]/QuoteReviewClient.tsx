"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock, CreditCard, ChevronRight, FileText, CheckCircle2, ChevronLeft, Image as ImageIcon, Check, MessageCircle, Building2, Edit3, Calendar, MapPin, RefreshCw, Download, Sparkles, CheckCircle, Zap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { RevisionBanner } from "@/components/quote/RevisionBanner";
import { BillingOverviewModal, BillingFormData } from "@/components/checkout/BillingOverviewModal";
import { SiteVisitBookingModal } from "@/components/checkout/SiteVisitBookingModal";
import { EmiBreakdownModal } from "@/components/quotation/EmiBreakdownModal";
import { extractErrorMessage } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  name: string;
  description: string;
  brand?: string;
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

function formatDate(dateStr: string, locale = "en") {
  const dateLocale = locale === "en" ? "en-IN" : `${locale}-IN`;
  return new Date(dateStr).toLocaleDateString(dateLocale, {
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
    pending_customer_approval: { label: t("qrc_status_review", "Review Requested"), classes: "bg-amber-100/50 text-amber-800 border-amber-200/50" },
    accepted: { label: t("quote_accepted", "Accepted"),          classes: "bg-emerald-100/50 text-emerald-800 border-emerald-200/50" },
    expired:  { label: t("quote_expired", "Expired"),           classes: "bg-rose-100/50 text-rose-800 border-rose-200/50" },
    rejected: { label: t("quote_rejected", "Rejected"),          classes: "bg-zinc-100/50 text-zinc-600 border-zinc-200/50" },
      PARTIAL_PAID: { label: t("qrc_status_partial", "Partially Paid"), classes: "bg-indigo-100/50 text-indigo-800 border-indigo-200/50" },
      PAID: { label: t("track_fully_paid", "Fully Paid"), classes: "bg-emerald-100/50 text-emerald-800 border-emerald-200/50" },
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

// ─── Main Client Component ───────────────────────────────────────────────────

export function QuoteReviewClient({ quote }: { quote: QuoteData }) {
  const { t, locale } = useTranslation();

  const localizeString = (str: string) => {
    let s = str;
    // H.264 / H.265 backup
    s = s.replace(/Approx\. (\d+) Days Backup · Motion @ H\.264/, t("qrc_backup_motion", "Approx. $1 Days Backup · Motion @ H.264").replace("{d}", "$1"));
    s = s.replace(/Approx\. (\d+) Days Backup - 24\/7 @ H\.264/, t("qrc_backup_247", "Approx. $1 Days Backup · 24/7 @ H.264").replace("{d}", "$1"));
    s = s.replace(/Approx\. (\d+) Days Backup · Motion @ H\.265/, t("qrc_backup_motion_265", "Approx. $1 Days Backup · Motion @ H.265").replace("{d}", "$1"));
    
    // Labor
    s = s.replace(/Standard HD Installation & Termination/, t("qrc_std_hd_install", "Standard HD Installation & Termination"));
    s = s.replace(/Standard IP Installation & Termination/, t("qrc_std_ip_install", "Standard IP Installation & Termination"));
    s = s.replace(/Excess Cabling Installation Labor \((\d+)m beyond (\d+)m free limit\)/, t("qrc_excess_labor", "Excess Cabling Installation Labor ($1m beyond $2m free limit)").replace("{d1}", "$1").replace("{d2}", "$2"));
    
    // Cables
    s = s.replace(/3\+1 Coaxial Cable \(Open\) \(~(\d+)m\) @ ₹(\d+)\/m/, t("qrc_coaxial_cable", "3+1 Coaxial Cable (Open) (~$1m) @ ₹$2/m").replace("{d1}", "$1").replace("{d2}", "$2"));
    s = s.replace(/CAT6 Cable \(Open\) \(~(\d+)m\) @ ₹(\d+)\/m/, t("qrc_cat6_cable", "CAT6 Cable (Open) (~$1m) @ ₹$2/m").replace("{d1}", "$1").replace("{d2}", "$2"));
    
    // Connectors
    s = s.replace(/BNC & DC Connector Set/, t("qrc_bnc_dc_conn", "BNC & DC Connector Set"));
    s = s.replace(/RJ45 Connectors/, t("qrc_rj45_conn", "RJ45 Connectors"));
    
    // Box
    s = s.replace(/PVC Weatherproof Camera Junction Box/, t("qrc_pvc_junction", "PVC Weatherproof Camera Junction Box"));
    
    // Camera features
    s = s.replace(/\(Color Night Vision, Audio IN\)/, t("qrc_color_night_audio", "(Color Night Vision, Audio IN)"));
    s = s.replace(/\(Color Night Vision\)/, t("qrc_color_night", "(Color Night Vision)"));
    s = s.replace(/\(Audio IN\)/, t("qrc_audio_in", "(Audio IN)"));
    
    // Cameras & Services
    s = s.replace(/Outdoor Bullet Camera/g, t("wz_prod_outdoor_bullet", "Outdoor Bullet Camera"));
    s = s.replace(/Indoor Dome Camera/g, t("wz_prod_indoor_dome", "Indoor Dome Camera"));
    s = s.replace(/Outdoor 4G SIM Camera/g, t("iqr_prod_outdoor_4g", "Outdoor 4G SIM Camera"));
    s = s.replace(/Indoor 4G SIM Camera/g, t("iqr_prod_indoor_4g", "Indoor 4G SIM Camera"));
    s = s.replace(/Outdoor Wi-Fi Camera/g, t("iqr_prod_outdoor_wifi", "Outdoor Wi-Fi Camera"));
    s = s.replace(/Indoor Wi-Fi Camera/g, t("iqr_prod_indoor_wifi", "Indoor Wi-Fi Camera"));
    s = s.replace(/Smart Wi-Fi Camera Wall Mounting & App Pairing/g, t("iqr_prod_wifi_mount", "Smart Wi-Fi Camera Wall Mounting & App Pairing"));
    s = s.replace(/Wireless Camera Wall Mounting, Power Concealment & App Setup/g, t("iqr_prod_wireless_mount", "Wireless Camera Wall Mounting, Power Concealment & App Setup"));
    s = s.replace(/Camera Installation & Setup/g, t("iqr_prod_install_setup", "Camera Installation & Setup"));
    s = s.replace(/Technician Site Visit & Mobilization Fee/g, t("iqr_prod_mobilization", "Technician Site Visit & Mobilization Fee"));
    s = s.replace(/Site Visit & Travel Fee/g, t("iqr_prod_site_visit", "Site Visit & Travel Fee"));
    s = s.replace(/Small Job Flat Rate:/g, t("iqr_prod_small_job", "Small Job Flat Rate:"));
    s = s.replace(/Surveillance SD Card/g, t("iqr_prod_sd_card", "Surveillance SD Card"));

    // Misc & Fallbacks
    s = s.replace(/Surveillance Hard Disk/g, t("qrc_surv_hdd", "Surveillance Hard Disk"));
    s = s.replace(/Weatherproof Camera Junction Box/g, t("wz_prod_junction_box", "Weatherproof Camera Junction Box"));
    s = s.replace(/Power Supply SMPS (\d+)Ch/g, t("qrc_power_supply_ch", "Power Supply SMPS $1Ch").replace("{d}", "$1"));
    s = s.replace(/Power Supply SMPS/g, t("iqr_prod_smps", "Power Supply SMPS"));
    s = s.replace(/Camera type:/g, t("qrc_cam_tech_prefix", "Camera type:"));
    s = s.replace(/^Add-on component$/i, t("qrc_item_addon", "Add-on accessory"));
    s = s.replace(/^Special Discount$/i, t("qrc_item_discount", "Special Discount"));
    s = s.replace(/^Applied discount$/i, t("qrc_desc_discount", "Applied discount"));
    s = s.replace(/^CCTV Component$/i, t("qrc_item_cctv", "CCTV Component"));
    s = s.replace(/^Discount$/i, t("qrc_badge_discount", "Discount"));
    
    return s;
  };
  const [accepted, setAccepted] = useState(quote.status === "accepted");
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [isPayingEMI, setIsPayingEMI] = useState(false);
  const [isPayingFull, setIsPayingFull] = useState(false);
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);
  const [isRequestingPdf, setIsRequestingPdf] = useState(false);

  const handleRequestPdf = async () => {
    try {
      setIsRequestingPdf(true);
      const res = await fetch(`/api/quote/${quote.id}/whatsapp`, { method: "POST" });
      if (!res.ok) throw new Error(t("qrc_err_wa", "Failed to send WhatsApp"));
      toast.success(t("qrc_ok_wa_pdf", "Quote PDF sent to your WhatsApp successfully!"));
    } catch (e) {
      toast.error(t("qrc_err_wa_pdf", "Could not send PDF right now. Please try again."));
    } finally {
      setIsRequestingPdf(false);
    }
  };

  const subtotal = quote.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = subtotal + (subtotal * quote.gstPercent / 100);
  const emiMonthlyAmount = Math.round(total / 12 * 1.06);
  const halfGst = (subtotal * quote.gstPercent / 100) / 2;
  const isPartiallyPaid = (quote.amount_paid || 0) > 0 && (quote.amount_due || 0) > 0;
  const advance = isPartiallyPaid && quote.amount_due ? quote.amount_due : 500;
  const daysLeft = daysUntil(quote.validUntil);

  useEffect(() => {
    // Preload Razorpay checkout SDK on mount for instant mobile checkout
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const loadRazorpayScript = async (retries = 2): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      const success = await new Promise<boolean>((resolve) => {
        if (typeof window !== "undefined" && (window as any).Razorpay) {
          resolve(true);
          return;
        }
        
        let timeout: NodeJS.Timeout;
        
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) {
          // If script is already attached, listen to load or wait
          (existing as HTMLScriptElement).onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          (existing as HTMLScriptElement).onerror = () => {
            clearTimeout(timeout);
            existing.remove();
            resolve(false);
          };
          timeout = setTimeout(() => {
            resolve(Boolean((window as any).Razorpay));
          }, 10000);
          return;
        }
        
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        
        script.onload = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          script.remove();
          resolve(false);
        };
        
        document.body.appendChild(script);
        
        // Timeout after 10 seconds for mobile connections
        timeout = setTimeout(() => {
          resolve(Boolean((window as any).Razorpay));
        }, 10000);
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
      if (returnUrlOnly) {
        const toastId = toast.loading(t("qrc_gen_pay_link", "Generating secure payment link..."));
        const res = await fetch("/api/payment/razorpay-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId: quote.id,
            leadId: quote.leadId,
            paymentType: backendType,
          }),
        });
        const data = await res.json();
        toast.dismiss(toastId);
        if (data.success && data.payment_url) {
          return data.payment_url;
        }
        toast.error(extractErrorMessage(data, t("qrc_err_pay_link", "Failed to generate payment link")));
        return null;
      }

      const toastId = toast.loading(t("qrc_init_gateway", "Initializing secure payment gateway..."));
      
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
        toast.error(extractErrorMessage(data, t("qrc_err_init_pay", "Failed to initialize payment")), { id: toastId });
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error(t("qrc_err_gateway_load", "Failed to load payment gateway. Please check your connection."), { id: toastId });
        return;
      }

      toast.dismiss(toastId);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "TEAM CCTV",
        description: t("qrc_secure_checkout", "Secure Checkout"),
        order_id: data.orderId,
        handler: function (response: any) {
          toast.success(t("qrc_pay_ok_verifying", "Payment Successful! Verifying..."));
          window.location.href = `/payment-success?quoteId=${quote.id}&paymentId=${response.razorpay_payment_id}`;
        },
        prefill: {
          name: quote.customer.name,
          contact: quote.customer.phone,
          email: quote.customer.email || "",
        },
        theme: { color: "#000000" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
         toast.error(response.error?.description || t("qrc_pay_failed", "Payment failed or cancelled."));
      });
      rzp.open();

    } catch (e: any) {
      toast.error(t("qrc_err_gateway_occurred", "An error occurred loading the payment gateway."));
      console.error(e);
    }
  };

  const openHostedPaymentLink = async (type: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi") => {
    const url = await redirectToPaymentLink(type, "all", true);
    if (typeof url === "string") {
      window.location.href = url;
    }
  };

  const handleWhatsAppShare = async () => {
    const url = await redirectToPaymentLink("advance_500", "all", true);
    if (typeof url === "string") {
      const message = t("qrc_wa_share_msg", "Hi! Here is the secure payment link to confirm your CCTV installation booking: {url}", { url });
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
      toast.error(t("qrc_err_save_billing", "Failed to save billing details. Proceeding with payment..."));
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
        toast.error(t("qrc_sdk_blocked", "Payment SDK blocked by your browser. Redirecting securely..."), { duration: 5000 });
        
        const success = await redirectToPaymentLink(type, method);
        // @ts-ignore`n        if (success) return;

        toast.error(t("qrc_adblocker_hint", "Could not load payment gateway. Please disable your ad-blocker or try a different browser."));
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
        throw new Error(extractErrorMessage(data, t("qrc_err_initiate_pay", "Failed to initiate payment")));
      }

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "TEAM CCTV",
        description: t("qrc_pay_desc", "Security System Installation ({mode})", {
          mode: type === "advance" ? t("bo_mode_adv", "Advance Booking") : t("bo_mode_full", "Full Payment"),
        }),
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
          toast.success(t("qrc_pay_confirmed_sched", "Payment confirmed! Scheduling installation..."));
          setAccepted(true);
          window.location.href = `/payment-success?quoteId=${quote.id}&paymentId=${response.razorpay_payment_id}`;
        },
        modal: {
          ondismiss: function () {
            toast.info(t("qrc_pay_win_closed", "Payment window closed."));
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        toast.error(extractErrorMessage(response, t("qrc_pay_failed", "Payment failed or cancelled.")));
      });
      rzp.open();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, t("qrc_pay_init_failed", "Payment initiation failed")));
      console.error(err);
    } finally {
      setIsPayingEMI(false);
      setIsPayingFull(false);
      setIsPayingAdvance(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info(t("qrc_gen_pdf", "Generating your PDF..."));
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      const pdfRes = await fetch(`/api/v1/leads/${quote.leadId}/quotes/${quote.id}/pdf?t=${Date.now()}`, {
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
         toast.error(t("qrc_err_pdf_gen", "Failed to generate PDF."));
      }
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error(t("qrc_err_pdf_dl", "An error occurred while downloading the PDF."));
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
              <ChevronLeft className="w-4 h-4 text-zinc-500" /> {t("qrc_modify_setup")}
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <StatusBadge status={accepted ? "accepted" : quote.status} />
            {!accepted && daysLeft > 0 && (
              <span className="text-[11px] font-semibold text-zinc-500 hidden sm:inline">
                {t("qrc_validity_days").replace("%d", daysLeft.toString())}
              </span>
            )}
            <button
              onClick={handleRequestPdf}
              disabled={isRequestingPdf}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full shadow-xs hover:bg-emerald-100 transition-all ${isRequestingPdf ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">{isRequestingPdf ? t("qrc_sending") : t("qrc_pdf_on_whatsapp")}</span>
              <span className="xs:hidden">{t("qrc_whatsapp")}</span>
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
                    <ShieldCheck className="w-3 h-3" /> {t("qrc_official_quotation")}
                  </span>
                  <span className="text-xs text-blue-200 font-mono font-medium">#{quote.quoteNumber}</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {t("qrc_price_lock")}
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200/80">{t("qrc_total_estimate")}</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">{formatINR(total)}</span>
                    <span className="text-xs text-emerald-400 font-semibold">{t("qrc_incl_gst")}</span>
                  </div>

                  {/* Golden EMI Pill Anchor */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowEmiModal(true)}
                      className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] sm:text-xs shadow-md transition-all active:scale-95 cursor-pointer group whitespace-normal text-center leading-snug"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-950 group-hover:scale-110 transition-transform shrink-0" />
                      <span>{t("qrc_or_emi_mo", "or ₹{amt}/mo (EMI)", { amt: emiMonthlyAmount.toLocaleString("en-IN") })}</span>
                      <span className="bg-slate-950 text-amber-300 text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full ml-0.5 shrink-0">
                        {t("qrc_plans_info", "Plans ⓘ")}
                      </span>
                    </button>
                  </div>

                  {/* In-Hero Direct Booking CTA */}
                  <div className="mt-2.5 max-w-sm">
                    <button
                      type="button"
                      onClick={() => openBillingModal("advance_500")}
                      disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-400/30 whitespace-normal text-center leading-snug"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span>{t("qrc_book_token_500", "Book with ₹500 Token Advance")}</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                    <p className="text-[10px] text-blue-200/80 mt-1 text-center sm:text-left">
                      {t("qrc_full_setup_inc", "✓ Full Setup Included • Balance after live testing")}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-xs min-w-[220px] shrink-0">
                  <div className="flex items-center justify-between text-slate-300 text-[10px] uppercase tracking-wider font-semibold">
                    <span>{t("qrc_customer_details")}</span>
                    <button
                      onClick={() => openBillingModal("advance_500")}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-bold"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> {t("qrc_edit")}
                    </button>
                  </div>
                  <p className="font-bold text-white text-sm mt-0.5 truncate">
                    {billingData.is_business && billingData.company_name ? billingData.company_name : (billingData.customer_name || quote.customer.name)}
                  </p>
                  <p className="text-slate-300 text-[11px] truncate mt-0.5">
                    {billingData.address_line1 ? (billingData.address_line1 + ', ' + billingData.city) : quote.installationAddress}
                  </p>
                  {billingData.is_business && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      {t("qrc_gst_label", "GST:")} {billingData.gstin || t("qrc_gst_registered", "Registered")}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-5 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-slate-200">
                <div className="flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t("qrc_100_genuine")}</span>
                </div>
                <div className="flex items-center justify-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{t("qrc_1_yr_warranty")}</span>
                </div>
                <div className="flex items-center justify-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t("qrc_days_setup")}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Affordability & Flexibility Twin-Trust Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 px-4 sm:px-0">
            {/* Card 1: Easy EMI */}
            <div 
              onClick={() => setShowEmiModal(true)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 hover:border-blue-400 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-900">
                      {t("qrc_easy_emi_from", "Easy EMI from ₹{amt}/mo", { amt: emiMonthlyAmount.toLocaleString("en-IN") })}
                    </span>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t("qrc_no_cost_avail", "No Cost Available")}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
                    {t("qrc_emi_banks_razorpay", "HDFC, ICICI, SBI, Axis, Bajaj Finserv & more • Powered by Razorpay")}
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center shrink-0 ml-2">
                <span>{t("qrc_plans_btn", "Plans")}</span> <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>

            {/* Card 2: Zero Risk Advance */}
            <div 
              onClick={() => openBillingModal("advance_500")}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 hover:border-emerald-400 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-900">
                      {t("qrc_pay_after_install", "Pay After Installation (Zero Risk)")}
                    </span>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t("qrc_token_badge_500", "₹500 Booking Token")}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
                    {t("qrc_token_desc", "Book your technician slot with ₹500 token, pay balance only after live camera testing")}
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center shrink-0 ml-2">
                <span>{t("qrc_book_btn", "Book")}</span> <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>

          {/* Itemized Bill of Materials (Edge-to-Edge on Mobile) */}
          <motion.div variants={fadeIn} className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-sm border-b sm:border border-zinc-200/80 p-4 sm:p-7">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {t("bill_of_materials", "Itemized Bill of Materials")}
                </h3>
                <p className="text-[11px] text-zinc-500">{t("qrc_verified_components").replace("%d", quote.lineItems.length.toString())}</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors shrink-0"
              >
                <Download className="w-3 h-3 text-zinc-600" />
                <span>{t("qrc_pdf")}</span>
              </button>
            </div>

            {/* Desktop Itemized Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3 w-10">#</th>
                    <th className="pb-3">{t("qrc_th_item_desc", "Item & Description")}</th>
                    <th className="pb-3 text-center w-16">{t("qrc_th_qty", "Qty")}</th>
                    <th className="pb-3 text-right w-24">{t("qrc_unit_price", "Unit Price")}</th>
                    <th className="pb-3 text-right w-28">{t("qrc_th_line_total", "Line Total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {quote.lineItems.map((item, idx) => {
                    const cleanDescription = (item.description || "").replace(/Camera type: undefined \| /g, "");
                    return (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 font-bold text-zinc-400">#{idx + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                            <span>{localizeString(item.name)}</span>
                            {item.brand && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                {item.brand === "Budget Brand" || item.brand === "Budget" ? t("dvg_brand_budget_lbl", "Budget Brand") : item.brand}
                              </span>
                            )}
                          </div>
                          {cleanDescription && (
                            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                              {localizeString(cleanDescription)}
                            </p>
                          )}
                          {item.badge && (
                            <span
                              className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide border"
                              style={{
                                backgroundColor: item.badge.color ? `${item.badge.color}15` : '#f4f4f5',
                                color: item.badge.color || '#52525b',
                                borderColor: item.badge.color ? `${item.badge.color}30` : '#e4e4e7'
                              }}
                            >
                              {localizeString(item.badge.label)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-zinc-600">
                          {formatINR(item.unitPrice)}
                        </td>
                        <td className="py-3 text-right font-bold text-zinc-900">
                          {formatINR(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-2.5">
              {quote.lineItems.map((item, idx) => {
                const cleanDescription = (item.description || "").replace(/Camera type: undefined \| /g, "");
                return (
                  <div key={item.id || idx} className="bg-white border border-zinc-100 rounded-2xl p-3.5 shadow-xs">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 px-1 py-0.5 rounded border border-zinc-100">#{idx + 1}</span>
                          {localizeString(item.name)}
                        </h4>
                        {item.brand && (
                          <span className="inline-block mt-0.5 mb-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                            {item.brand === "Budget Brand" || item.brand === "Budget" ? t("dvg_brand_budget_lbl", "Budget Brand") : item.brand}
                          </span>
                        )}
                        {cleanDescription && (
                          <p className="text-[10px] text-zinc-500 mt-1 leading-snug line-clamp-2">
                            {localizeString(cleanDescription)}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                        {t("qrc_qty_colon", "Qty: {qty}", { qty: String(item.quantity) })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-50">
                      <span className="text-zinc-500">{t("qrc_unit_price")}: {formatINR(item.unitPrice)}</span>
                      <span className="font-bold text-zinc-900">{formatINR(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Breakdown Card */}
            <div className="mt-5 pt-4 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[11px] text-zinc-500 space-y-1">
                <p>{t("qrc_price_include_standard")}</p>
                <p>{t("qrc_gst_18_computed")}</p>
                {quote.notes && (
                  <p className="text-zinc-600 font-medium">{t("qrc_note")} {quote.notes} {quote.companyGstin && `| GSTIN: ${quote.companyGstin}`}</p>
                )}
              </div>

              <div className="w-full sm:w-72 bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>{t("qrc_taxable_subtotal")}</span>
                  <span className="font-semibold text-zinc-900">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>{t("qrc_cgst")} ({quote.gstPercent / 2}%)</span>
                  <span>{formatINR(halfGst)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 pb-2 border-b border-zinc-200">
                  <span>{t("qrc_sgst")} ({quote.gstPercent / 2}%)</span>
                  <span>{formatINR(halfGst)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-zinc-900">{t("total", "Grand Total")}</span>
                  <span className="text-lg font-black tracking-tight text-blue-950">{formatINR(total)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-zinc-200 text-emerald-700 font-bold text-[11px]">
                  <span>{t("qrc_booking_advance_due")}</span>
                  <span className="text-xs font-black">{formatINR(advance)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4-PILLAR CUSTOMER PEACE-OF-MIND GUARANTEE */}
          <div className="px-4 sm:px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900">{t("qrc_p1_title", "Zero Advance Risk")}</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{t("qrc_p1_desc", "₹500 token booking. Balance after live camera test on phone.")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900">{t("qrc_p2_title", "100% Original Brand")}</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{t("qrc_p2_desc", "Original sealed boxes with valid brand warranty and GST bill.")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900">{t("qrc_p3_title", "Certified Engineers")}</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{t("qrc_p3_desc", "Police-verified engineers equipped with pro wiring tools.")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900">{t("qrc_price_lock", "7-Day Price Lock")}</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{t("qrc_p4_desc", "This quote is locked. No hidden charges on site visit.")}</p>
                </div>
              </div>
            </div>
          </div>

{/* Dual Action / Next Steps Section */}
          <motion.div variants={fadeIn} id="payment-section" className="pt-0 sm:pt-4">
            {!accepted ? (
              <div className="space-y-4 sm:space-y-6">
                
                {/* Main Action Box (Edge-to-Edge on Mobile) */}
                <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-10 shadow-none sm:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-y sm:border border-zinc-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-900">{t("qrc_how_proceed")}</h3>
                      <p className="text-xs sm:text-sm text-zinc-500">{t("qrc_how_proceed_desc")}</p>
                    </div>
                  </div>

                  
                    {/* 3-Plan Checkout Experience */}
                    <div className="mb-8">
                      <div className="text-center mb-6">
                         <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-2">{t("qrc_choose_plan")}</h3>
                         <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("qrc_choose_plan_desc")}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* Option 1: Standard Milestone (Lowest Upfront) */}
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 flex flex-col justify-between shadow-sm group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-max max-w-[90%]">
                            <span className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm text-center leading-tight">
                              {t("qrc_lowest_advance_badge", "₹500 Token Start")}
                            </span>
                          </div>
                          
                          <div>
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="text-lg font-black text-emerald-950">{t("qrc_milestone_plan")}</h4>
                              <span className="text-xs font-bold text-emerald-700">{t("qrc_today_badge").replace("{d}", "500")}</span>
                            </div>
                            <p className="text-xs text-emerald-900/70 leading-relaxed mb-4">
                              {t("qrc_lowest_upfront").replace("{d}", "500")}
                            </p>
                            
                            <div className="space-y-2 text-xs text-zinc-700 bg-white/70 rounded-xl p-3 mb-5 border border-emerald-100">
                              <div className="flex items-center justify-between border-b border-emerald-100/70 pb-1">
                                <span className="font-medium">{t("qrc_booking_token")}</span>
                                <span className="font-black text-emerald-700">₹500</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-emerald-100/70 pb-1">
                                <span className="font-medium">{t("qrc_at_delivery")}</span>
                                <span className="font-bold text-zinc-900">₹{Math.round((total - 500) * 0.90).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="font-medium">{t("qrc_post_setup")}</span>
                                <span className="font-bold text-zinc-900">₹{Math.round((total - 500) * 0.10).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openBillingModal("advance_500")}
                            disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 whitespace-normal text-center leading-snug"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
                            <span>{t("qrc_book_with_advance", "Book with ₹{d} Advance", { d: "500" })}</span>
                          </button>
                        </div>

                        {/* Option 2: Smart Pay (Full Discount) */}
                        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between hover:border-zinc-300 transition-all">
                          <div>
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="text-lg font-black text-zinc-900">{t("qrc_smart_pay")}</h4>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{t("qrc_save_2pct")}</span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                              {t("qrc_pay_100_upfront")}
                            </p>
                            
                            <div className="bg-white rounded-xl p-3 mb-5 border border-zinc-200/80 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-500">{t("qrc_regular_total")}</span>
                                <span className="text-zinc-400 line-through">₹{total.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-zinc-900">{t("qrc_discounted")}</span>
                                <span className="text-sm font-black text-emerald-600">₹{Math.round(total * 0.98).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 text-right">
                                {t("qrc_instant_savings", "Instant Savings: ₹{d}", { d: Math.round(total * 0.02).toLocaleString('en-IN') })}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openBillingModal("full_discount")}
                            disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                            className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 whitespace-normal text-center leading-snug"
                          >
                            <CreditCard className="w-4 h-4 text-zinc-300 shrink-0" />
                            <span>{t("qrc_pay_amount", "Pay ₹{d}", { d: Math.round(total * 0.98).toLocaleString('en-IN') })}</span>
                          </button>
                        </div>
                        
                        {/* Option 3: Flexi EMI */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200 flex flex-col justify-between hover:border-amber-300 transition-all shadow-xs">
                          <div>
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="text-lg font-black text-zinc-900">{t("qrc_flexi_emi")}</h4>
                              <span className="text-[10px] font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded-full">{t("qrc_from_emi_mo", "from ₹{amt}/mo", { amt: emiMonthlyAmount.toLocaleString('en-IN') })}</span>
                            </div>
                            <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                              {t("qrc_convert_emi")}
                            </p>
                            
                            <div className="space-y-2 text-xs text-zinc-700 mb-5 bg-white/80 rounded-xl p-3 border border-amber-100">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t("qrc_zero_foreclosure")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t("qrc_instant_approval")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t("qrc_12_months_tenure")}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setShowEmiModal(true)}
                            disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer whitespace-normal text-center leading-snug"
                          >
                            <CreditCard className="w-4 h-4 text-slate-950 shrink-0" />
                            <span>{t("qrc_view_emi_banks", "View EMI Plans & Banks")}</span>
                          </button>
                        </div>

                      </div>

                      {/* 4th Path: Free Site Visit (Confidence Builder) */}
                      <div className="mt-6 sm:mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 dark:border-purple-900/30 rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 text-left shadow-sm">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-black text-purple-900 dark:text-purple-300 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>{t("qrc_not_sure_title", "Not Sure About Your Exact Requirements?")}</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-purple-800/80 dark:text-purple-300/80 mt-1.5 leading-relaxed font-medium">
                            {t("qrc_not_sure_pre", "Don't worry! Book a")} <strong className="text-purple-900 dark:text-purple-200">{t("qrc_not_sure_bold", "100% Free Physical Site Survey")}</strong>{t("qrc_not_sure_post", ". Our engineer will visit your property, assess your exact camera coverage needs, and finalize the quotation with zero obligation.")}
                          </p>
                        </div>
                        <button 
                          onClick={() => setIsSurveyModalOpen(true)}
                          className="w-full sm:w-auto shrink-0 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-normal text-center leading-snug"
                        >
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>{t("qrc_book_free_survey", "Book Free Survey")}</span>
                        </button>
                      </div>

                      

                    </div>


                    <div className="flex flex-col items-center justify-center gap-2 pt-2">
                    <button 
                      onClick={() => openHostedPaymentLink("advance_500")}
                      className="text-xs text-zinc-500 hover:text-blue-600 underline underline-offset-2 transition-colors text-center"
                    >
                      {t("qrc_trouble_payment", "Trouble with the payment window? Click here to pay securely.")}
                    </button>
                    <button 
                      onClick={handleWhatsAppShare}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors flex items-center gap-1.5 pt-1 text-center"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>{t("qrc_wa_alt_device", "Send Payment Link via WhatsApp (Alternate Device)")}</span>
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
                <h3 className="text-2xl font-bold mb-2">{t("qrc_accepted_title", "Quote Accepted & Paid!")}</h3>
                <p className="text-emerald-50 font-medium text-sm">{t("qrc_accepted_desc", "Thank you for choosing TEAM CCTV. Our dispatch team will contact you shortly to schedule your installation.")}</p>
              </motion.div>
            )}
          </motion.div>

        </motion.div>
      </div>

      {/* Mobile-Friendly Sticky Bottom Bar */}
      {!accepted && !isBillingModalOpen && !isSurveyModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(0.4rem,env(safe-area-inset-bottom))]">
          <div className="px-2 py-2 max-w-lg mx-auto space-y-2.5">
            
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t("qrc_sticky_total", "Total Estimate")}</span>
                <span className="text-lg font-black text-zinc-900 leading-none">{formatINR(total)}</span>
              </div>
              
              <button
                onClick={handleRequestPdf}
                disabled={isRequestingPdf}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${isRequestingPdf ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" /> {t("qrc_sticky_wa_pdf", "WhatsApp PDF")}
              </button>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setShowEmiModal(true)}
                disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-2xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black leading-tight">{t("qrc_sticky_emi", "EMI Plans")}</span>
              </button>

              <button
                onClick={() => openBillingModal("full_discount")}
                disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-blue-600" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight">{t("qrc_sticky_full2", "2% Off Full")}</span>
              </button>

              <button
                onClick={() => openBillingModal("advance_500")}
                disabled={isPayingAdvance || isPayingFull || isPayingEMI}
                className="flex-[1.2] flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 text-center bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 font-black"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black leading-tight">{t("qrc_sticky_book500", "Book ₹500")}</span>
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

      {/* EMI Breakdown Modal */}
      <EmiBreakdownModal
        isOpen={showEmiModal}
        onClose={() => setShowEmiModal(false)}
        totalAmount={total}
        packageName={t("qrc_emi_pkg_name", "Confirmed Quotation #{num}", { num: quote.quoteNumber })}
        onProceed={() => {
          setShowEmiModal(false);
          openBillingModal("emi");
        }}
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
          toast.success(t("qrc_survey_registered", "Survey request registered! Our team will contact you."));
        }}
      />
    </div>
  );
}

