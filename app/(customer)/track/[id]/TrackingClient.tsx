"use client";

import { 
  CheckCircle2, 
  MapPin, 
  Package, 
  Phone, 
  ShieldCheck, 
  Truck, 
  Wrench, 
  Download, 
  FileText, 
  ExternalLink,
  Receipt,
  IndianRupee,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { motion } from "framer-motion";
import { PaymentStagesWidget } from "@/components/shared/PaymentStagesWidget";

interface TrackingClientProps {
  lead: any;
  job: any;
  quote: any;
  invoice?: any;
}

export default function TrackingClient({ lead, job, quote, invoice }: TrackingClientProps) {
  const [pinRevealed, setPinRevealed] = useState(false);
  const { t } = useTranslation();

  // Determine current step index
  let currentStep = 1; // 1: Order Confirmed
  if (job) currentStep = 2; // 2: Equipment Ready / Dispatching
  if (job?.status === "dispatched" || job?.status === "in_progress" || lead.assigned_to_installer_id || lead.status === "site_visit") currentStep = 3; // 3: Installer En-Route
  if (lead.status === "won" && (lead.installation_proof_url || lead.install_status === "COMPLETED")) currentStep = 4; // 4: Completed

  const steps = [
    { num: 1, label: t("track_step_1", "Order Confirmed"), desc: t("track_step_1_desc", "Booking verified & hardware mapped."), icon: ShieldCheck },
    { num: 2, label: t("track_step_2", "Equipment Ready"), desc: t("track_step_2_desc", "Hardware packaged & dispatched from hub."), icon: Package },
    { num: 3, label: t("track_step_3", "Installer on the Way"), desc: t("track_step_3_desc", "Field technician scheduled for your site."), icon: Truck },
    { num: 4, label: t("track_step_4", "Installation Complete"), desc: t("track_step_4_desc", "Cameras mounted & testing verified."), icon: Wrench },
  ];

  const targetQuoteId = quote?.id || lead?.latest_quote_id || lead?.won_quote_id || lead?.id;
  const totalAmount = quote?.total_payable || quote?.pricingSnapshot?.total_payable || lead?.total_payable || 0;
  const isAdvancePaid = (quote?.amount_paid || 0) >= 500 || lead?.booking_amount > 0 || lead?.payment_status === "advance_paid" || quote?.status === "BOOKED";
  const isFullyPaid = quote?.status === "PAID" || quote?.payment_status === "paid" || lead?.payment_status === "paid";
  const amountPaid = quote?.amount_paid || (isAdvancePaid ? 500 : 0);
  const amountDue = isFullyPaid ? 0 : Math.max(0, totalAmount - amountPaid);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-6 md:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto space-y-6 sm:space-y-8"
      >
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-1">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            {t("track_installation", "Track Your Installation")}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-mono text-xs sm:text-sm font-bold">
            Order Reference: #{lead.id?.substring(0, 10).toUpperCase()}
          </p>
        </div>

        {/* ── FINANCIAL & DOCUMENT ACTIONS BAR ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Setup Cost</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {isAdvancePaid && !isFullyPaid && (
                <div className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  ₹{amountPaid.toLocaleString("en-IN")} Advance Paid • Balance Due: ₹{amountDue.toLocaleString("en-IN")}
                </div>
              )}
              {isFullyPaid && (
                <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                </div>
              )}
            </div>
          </div>

          {/* Quick Document Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Tax Invoice / Booking Receipt Download */}
            {(isAdvancePaid || isFullyPaid || invoice) && targetQuoteId && (
              <a
                href={`/api/invoice/${targetQuoteId}/download`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>{isFullyPaid ? "Download Tax Invoice" : "Download Advance Receipt"}</span>
              </a>
            )}

            {/* View Full Quotation */}
            {targetQuoteId && (
              <Link
                href={`/quote/${lead.id}/review/${targetQuoteId}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all"
              >
                <FileText className="w-4 h-4 text-zinc-400" />
                <span>View Full Quotation</span>
              </Link>
            )}

            {/* Download Quote PDF */}
            {targetQuoteId && (
              <a
                href={`/api/quote/${targetQuoteId}/download`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                <span>Quote PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* OTP Secure Box (Only visible when active & installer assigned, but not yet completed) */}
        {lead.completion_pin && currentStep >= 2 && currentStep < 4 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/20 dark:border-emerald-500/10 rounded-[2rem] p-4 md:p-8 text-center shadow-2xl shadow-emerald-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">{t("track_secret_pin", "Secret Completion PIN")}</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              {t("track_pin_desc", "Please give this 6-digit PIN to your installer only after the installation is fully completed and you are happy with it.")}
            </p>
            <div className="inline-flex items-center justify-center gap-2 sm:gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 relative">
              {lead.completion_pin.split('').map((digit: string, i: number) => (
                <div key={i} className="w-10 h-12 sm:w-14 sm:h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white shadow-sm select-none">
                  {pinRevealed ? digit : "●"}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setPinRevealed(!pinRevealed); if (!pinRevealed) setTimeout(() => setPinRevealed(false), 10000); }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
            >
              {pinRevealed ? <><EyeOff className="w-4 h-4" /> Hide PIN</> : <><Eye className="w-4 h-4" /> Tap to Reveal PIN</>}
            </button>
            {pinRevealed && <p className="text-xs text-zinc-400 mt-2">PIN will auto-hide in 10 seconds</p>}
            
            {lead.assigned_installer_name && (
              <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 py-3 px-6 rounded-full w-fit mx-auto border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" /> {t("track_installer_assigned", "Installer Assigned:")} {lead.assigned_installer_name}
              </div>
            )}
          </motion.div>
        )}

        {/* Payment Stages Timeline */}
        <PaymentStagesWidget quoteId={targetQuoteId} lead={lead} quote={quote} />

        {/* Progress Stepper */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-none">
          <div className="relative">
            <div className="absolute left-[31px] top-[32px] bottom-[32px] w-0.5 bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-10 relative">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const isPending = currentStep < step.num;
                const Icon = step.icon;

                return (
                  <div key={idx} className="flex items-start gap-6 group">
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-sm transition-all duration-500 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'}`}>
                      {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Icon className={`w-7 h-7 ${isCurrent ? 'animate-pulse' : ''}`} />}
                    </div>
                    <div className="pt-3">
                      <h3 className={`font-black text-xl tracking-tight transition-colors ${isPending ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-white'}`}>
                        {step.label}
                      </h3>
                      <p className={`text-sm mt-1.5 leading-relaxed ${isPending ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none flex items-start gap-5">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl shrink-0">
            <MapPin className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div>
            <h4 className="font-black text-xs text-zinc-900 dark:text-white uppercase tracking-widest mb-2">{t("track_service_address", "Service Address")}</h4>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              <span className="text-zinc-900 dark:text-white font-bold">{lead.customer_name}</span><br/>
              {lead.address?.full_address || lead.address?.street || lead.detected_city || t("track_address_not_provided", "Address not provided")}<br/>
              {lead.mobile_number}
            </p>
          </div>
        </div>
        
        {/* Help */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href="https://wa.me/918001234567?text=Hi!%20I%20need%20help%20with%20my%20installation%20or%20need%20to%20reschedule." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
            <Phone className="w-4 h-4" />
            Reschedule / Cancel Booking
          </a>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t("track_need_help", "Need help? Contact support at")} <a href="tel:18001234567" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold hover:underline transition-all">1800-123-4567</a>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
