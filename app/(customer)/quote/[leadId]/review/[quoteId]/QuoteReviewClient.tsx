"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { load } from "@cashfreepayments/cashfree-js";
import type { Cashfree } from "@cashfreepayments/cashfree-js";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock, CreditCard, ChevronRight, FileText, CheckCircle2, ChevronLeft, Image as ImageIcon, Check } from "lucide-react";

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
  status: "pending" | "accepted" | "expired" | "rejected";
  issuedAt: string;
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
  const map = {
    pending:  { label: "Awaiting Approval", classes: "bg-amber-100/50 text-amber-800 border-amber-200/50" },
    accepted: { label: "Accepted",          classes: "bg-emerald-100/50 text-emerald-800 border-emerald-200/50" },
    expired:  { label: "Expired",           classes: "bg-rose-100/50 text-rose-800 border-rose-200/50" },
    rejected: { label: "Rejected",          classes: "bg-zinc-100/50 text-zinc-600 border-zinc-200/50" },
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
  const [accepted, setAccepted] = useState(quote.status === "accepted");
  const [isPayingEMI, setIsPayingEMI] = useState(false);
  const [isPayingFull, setIsPayingFull] = useState(false);
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);
  const [cashfree, setCashfree] = useState<Cashfree | null>(null);

  const subtotal = quote.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = subtotal + (subtotal * quote.gstPercent / 100);
  const halfGst = (subtotal * quote.gstPercent / 100) / 2;
  const advance = Math.round(total * (quote.advancePercent / 100));
  const daysLeft = daysUntil(quote.validUntil);

  useEffect(() => {
    const initCashfree = async () => {
      try {
        const cf = await load({ mode: "sandbox" }); 
        setCashfree(cf);
      } catch (err) {
        console.error("Failed to load Cashfree SDK", err);
      }
    };
    initCashfree();
  }, []);

  const handlePayment = async (type: "advance" | "full", method: "all" | "emi") => {
    if (!cashfree) {
      toast.error("Payment system not ready. Please refresh.");
      return;
    }

    if (method === "emi") setIsPayingEMI(true);
    else if (type === "full") setIsPayingFull(true);
    else setIsPayingAdvance(true);

    try {
      const res = await fetch(`/api/quotes/${quote.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: quote.leadId, paymentType: type, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self" as const,
      };

      await cashfree.checkout(checkoutOptions);
    } catch (err: any) {
      toast.error(err.message);
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 font-sans pb-24 selection:bg-zinc-200">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20">

        {/* Top Actions & Status */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            {!accepted && (
              <a href={`/quote/${quote.leadId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4">
                <ChevronLeft className="w-4 h-4" /> Modify Configuration
              </a>
            )}
            <div className="flex items-center gap-3">
              <StatusBadge status={accepted ? "accepted" : quote.status} />
              {!accepted && daysLeft > 0 && (
                <span className="text-xs font-medium text-zinc-500 tracking-wide">
                  Valid until {formatDate(quote.validUntil)} ({daysLeft}d left)
                </span>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-full shadow-sm hover:bg-zinc-50 hover:shadow transition-all"
          >
            <FileText className="w-4 h-4" /> Download PDF
          </button>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          
          {/* Main Quote Document */}
          <motion.div variants={fadeIn} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-8 sm:px-10 sm:py-10 bg-white border-b border-zinc-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-1">Quotation</h1>
                  <p className="text-zinc-400 font-medium tracking-wide text-sm">#{quote.quoteNumber}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-semibold text-zinc-900">TEAM CCTV</div>
                  <div className="text-zinc-500 text-sm mt-1">Smart Security Solutions</div>
                  <div className="text-zinc-400 text-xs mt-0.5">Jaipur, Rajasthan</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">Date</p>
                  <p className="text-sm font-medium text-zinc-900">{formatDate(quote.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">Prepared For</p>
                  <p className="text-sm font-medium text-zinc-900">{quote.customer.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">Site Location</p>
                  <p className="text-sm font-medium text-zinc-900 truncate">{quote.installationAddress}</p>
                </div>
              </div>
            </div>

            {/* Bill of Materials */}
            <div className="px-6 py-8 sm:px-10">
              <h3 className="text-sm font-semibold text-zinc-900 mb-6">Bill of Materials</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="pb-4 text-xs font-medium text-zinc-400 w-3/5">Description</th>
                      <th className="pb-4 text-xs font-medium text-zinc-400 text-center w-1/12">Qty</th>
                      <th className="pb-4 text-xs font-medium text-zinc-400 text-right w-1/6">Rate</th>
                      <th className="pb-4 text-xs font-medium text-zinc-400 text-right w-1/6">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {quote.lineItems.map((item) => (
                      <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="py-5 pr-4">
                          <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
                          {item.badge && (
                            <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide border"
                                  style={{ backgroundColor: item.badge.color ? `${item.badge.color}15` : '#f4f4f5', color: item.badge.color || '#52525b', borderColor: item.badge.color ? `${item.badge.color}30` : '#e4e4e7' }}>
                              {item.badge.label}
                            </span>
                          )}
                        </td>
                        <td className="py-5 text-center text-sm text-zinc-700">{item.quantity}</td>
                        <td className="py-5 text-right text-sm text-zinc-500">{formatINR(item.unitPrice)}</td>
                        <td className="py-5 text-right text-sm font-medium text-zinc-900">{formatINR(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mt-8">
                <div className="w-full sm:w-64 space-y-3">
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>CGST ({quote.gstPercent / 2}%)</span>
                    <span>{formatINR(halfGst)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 pb-4 border-b border-zinc-100">
                    <span>SGST ({quote.gstPercent / 2}%)</span>
                    <span>{formatINR(halfGst)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold text-zinc-900">Total</span>
                    <span className="text-xl font-semibold tracking-tight text-zinc-900">{formatINR(total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Notes */}
            {quote.notes && (
              <div className="px-6 py-6 sm:px-10 bg-zinc-50/80 border-t border-zinc-100">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1">Notes</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{quote.notes} {quote.companyGstin && `| GSTIN: ${quote.companyGstin}`}</p>
              </div>
            )}
          </motion.div>

          {/* Visual Comparison */}
          <motion.div variants={fadeIn} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 p-6 sm:p-10">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800"><ImageIcon className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Resolution Clarity Comparison</h3>
                  <p className="text-xs text-zinc-500">Visualizing the difference in detail capture.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video group">
                 <Image src="/comparisons/2mp.png" alt="2MP View" width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                 <div className="absolute bottom-0 left-0 p-4">
                   <p className="text-white text-sm font-semibold">2MP Full HD</p>
                   <p className="text-white/70 text-xs mt-0.5">Standard identification (10-15ft)</p>
                 </div>
               </div>
               
               <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 aspect-video group shadow-lg shadow-emerald-500/10">
                 <Image src="/comparisons/5mp.png" alt="5MP View" width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                 <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Recommended</div>
                 <div className="absolute bottom-0 left-0 p-4">
                   <p className="text-white text-sm font-semibold">5MP Ultra 3K HD</p>
                   <p className="text-white/80 text-xs mt-0.5">Advanced identification (25-30ft)</p>
                 </div>
               </div>
             </div>
          </motion.div>

          {/* Value Propositions */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TermCard icon={<ShieldCheck className="w-5 h-5" />} title="1-Year Warranty" body="Complete equipment and labour coverage. Free replacement for any defective parts." delay={0.1} />
            <TermCard icon={<CreditCard className="w-5 h-5" />} title={`${quote.advancePercent}% Advance`} body={`${formatINR(advance)} required to initiate the project. Balance upon successful handover.`} delay={0.2} />
            <TermCard icon={<Clock className="w-5 h-5" />} title="Priority Support" body="Free remote assistance for 12 months. Next-business-day on-site support." delay={0.3} />
          </motion.div>

          {/* Action Area */}
          <motion.div variants={fadeIn} className="pt-8">
            {!accepted ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-100">
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">Complete Your Order</h3>
                <p className="text-sm text-zinc-500 mb-8">Choose your preferred payment method to schedule your installation.</p>

                {/* Cashfree EMI Banner */}
                <div className="relative bg-zinc-900 rounded-2xl p-6 sm:p-8 overflow-hidden mb-8 group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-1000 group-hover:scale-110" />
                   
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="max-w-md">
                       <div className="flex items-center gap-2 mb-3">
                         <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Easy EMI</span>
                         <span className="text-xs text-zinc-400 font-medium">Powered by Cashfree Payments</span>
                       </div>
                       <h4 className="text-lg font-semibold text-white mb-2">Split into manageable instalments</h4>
                       <p className="text-sm text-zinc-400">No-cost EMI available on major credit cards. Zero foreclosure charges. Instant digital approval.</p>
                     </div>
                     
                     <motion.button
                       whileTap={{ scale: 0.98 }}
                       onClick={() => handlePayment("full", "emi")}
                       disabled={isPayingEMI}
                       className="shrink-0 w-full md:w-auto px-6 py-3.5 bg-white text-zinc-900 text-sm font-semibold rounded-xl shadow-lg hover:bg-zinc-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                     >
                       {isPayingEMI ? "Processing..." : "Apply for EMI"}
                     </motion.button>
                   </div>
                </div>

                <div className="flex items-center gap-4 py-4">
                  <div className="h-px bg-zinc-200 flex-1" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Or Pay Directly</span>
                  <div className="h-px bg-zinc-200 flex-1" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePayment("advance", "all")}
                    disabled={isPayingAdvance || isPayingFull}
                    className="flex-1 py-4 px-6 bg-zinc-900 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isPayingAdvance ? "Processing..." : `Pay Advance (${formatINR(advance)})`}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePayment("full", "all")}
                    disabled={isPayingAdvance || isPayingFull}
                    className="flex-1 py-4 px-6 bg-white text-zinc-900 border border-zinc-200 rounded-xl text-sm font-semibold shadow-sm hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isPayingFull ? "Processing..." : `Pay Full Amount (${formatINR(total)})`}
                  </motion.button>
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
                <h3 className="text-2xl font-semibold mb-2">Quote Accepted & Paid!</h3>
                <p className="text-emerald-50 font-medium">Thank you for choosing TEAM CCTV. Our dispatch team will contact you shortly to schedule your installation.</p>
              </motion.div>
            )}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
