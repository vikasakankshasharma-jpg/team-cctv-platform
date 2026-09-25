"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Download, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  LogOut, 
  Package, 
  Truck, 
  Copy, 
  Check, 
  PhoneCall, 
  MessageSquare, 
  Layers,
  ChevronRight
, CreditCard} from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { PaymentStagesWidget } from "@/components/shared/PaymentStagesWidget";
import { SystemStatusWidget } from "@/components/shared/SystemStatusWidget";

export interface CustomerQuoteItem {
  quoteId: string;
  leadId: string;
  createdAt: string;
  totalPayable: number;
    amountPaid?: number;
    amountDue?: number;
  status: string;
  cameraCount?: number;
  propertyType?: string;
  siteAddress?: string;
  isPaid: boolean;
  customerName?: string;
  rawLead?: any;
  rawQuote?: any;
}

interface CustomerDashboardProps {
  user: {
    uid: string;
    mobile?: string;
    name?: string;
  };
  quotes: CustomerQuoteItem[];
}

export function CustomerDashboardClient({ user, quotes }: CustomerDashboardProps) {
  const safeUser = user || { uid: "", name: "Valued Client", mobile: "" };
  const safeQuotes = Array.isArray(quotes) ? quotes : [];
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [visibleBooked, setVisibleBooked] = useState(5);
  const [visibleUnbooked, setVisibleUnbooked] = useState(5);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/customer/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  };

  const bookedQuotes = safeQuotes.filter(q => q && q.isPaid);
  const unbookedQuotes = safeQuotes.filter(q => q && !q.isPaid);

  const totalQuotesCount = safeQuotes.length;
  const paidQuotesCount = bookedQuotes.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-4 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Bar: Profile & Logout */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0">
              {String(safeUser.name || "C").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white truncate">
                  {safeUser.name || "Valued Client"}
                </h1>
                <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
                  Customer
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {safeUser.mobile ? `+91 ${safeUser.mobile}` : "Authenticated Customer"}
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/wizard"
              className="flex-1 sm:flex-none flex items-center justify-center text-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap"
            >
              + New Quotation
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{loggingOut ? "Signing out..." : "Log Out"}</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex items-center justify-between sm:block">
            <div>
              <div className="flex items-center gap-2 text-zinc-500 mb-1 sm:mb-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Total Quotations</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                {totalQuotesCount}
              </div>
            </div>
            <p className="hidden sm:block text-xs text-zinc-400 mt-1 font-medium">Lifetime generated estimates</p>
            <FileText className="w-8 h-8 text-blue-600/20 sm:hidden" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex items-center justify-between sm:block">
            <div>
              <div className="flex items-center gap-2 text-zinc-500 mb-1 sm:mb-2">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Booked Installs</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                {paidQuotesCount}
              </div>
            </div>
            <p className="hidden sm:block text-xs text-zinc-400 mt-1 font-medium">Orders confirmed with advance payment</p>
            <Truck className="w-8 h-8 text-emerald-600/20 sm:hidden" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex items-center justify-between sm:block">
            <div>
              <div className="flex items-center gap-2 text-zinc-500 mb-1 sm:mb-2">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Tax Invoices</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                {paidQuotesCount}
              </div>
            </div>
            <p className="hidden sm:block text-xs text-zinc-400 mt-1 font-medium">Official GST tax invoices available</p>
            <Download className="w-8 h-8 text-indigo-600/20 sm:hidden" />
          </div>
        </div>

        {/* Quotations & Bookings Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
          
          {/* Section Header with Filters */}
          <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Your Quotations & Orders</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Review details, download official PDFs, or track live installation milestones.
              </p>
            </div>

            {/* Filter Pills */}
            
          </div>

          
          {/* Active Bookings / Installations */}
          <div className="bg-zinc-50 dark:bg-zinc-800/20 px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
             <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Active Bookings ({bookedQuotes.length})
             </h3>
          </div>
          
          {bookedQuotes.length === 0 ? (
            <div className="p-5 md:p-12 text-center border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                No active bookings yet.
              </h3>

            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {bookedQuotes.slice(0, visibleBooked).map((q: any) => (
                <div key={q.quoteId} className="p-6 sm:p-8 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    
                    {/* Left Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          {q.quoteId}
                          <button
                            onClick={() => handleCopy(q.quoteId)}
                            title="Copy Quote ID"
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            {copiedId === q.quoteId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>

                        {q.isPaid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            BOOKED / PAID
                          </span>
                        ) : q.status === "site_visit" || q.status === "survey_booked" ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            <Calendar className="w-3.5 h-3.5" />
                            SITE SURVEY SCHEDULED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            ESTIMATE GENERATED
                          </span>
                        )}

                        {q.propertyType && (
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            • {q.propertyType}
                          </span>
                        )}
                        {q.cameraCount ? (
                          <span className="text-xs text-zinc-500 font-bold">
                            • {q.cameraCount} Cameras
                          </span>
                        ) : null}
                      </div>

                      {q.siteAddress && (
                        <div className="flex items-start gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                           <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                           <span>{q.siteAddress}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          {new Date(q.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex flex-col items-end">
                          <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                            ₹{q.totalPayable?.toLocaleString("en-IN") || "—"}
                          </span>
                          {(q.amountDue ?? 0) > 0 && q.isPaid && (
                            <span className="text-[10px] text-red-500 font-bold -mt-0.5">
                              Balance: ₹{(q.amountDue ?? 0).toLocaleString("en-IN")}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* System Status Tracker */}
                    {q.isPaid && q.rawLead && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800/50 mt-4 pt-2 mb-4">
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Order Progress</p>
                        <SystemStatusWidget lead={q.rawLead} job={null} />
                      </div>
                    )}

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                      
                      <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                        {/* Review / View Quote */}
                        <Link
                          href={`/quote/${q.leadId}/review/${q.quoteId}`}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>View Quote</span>
                        </Link>

                        {/* Download Quote */}
                        <a
                          href={`/api/quote/${q.quoteId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Download PDF</span>
                        </a>
                      </div>

                      {/* Track Booking */}
                      {q.isPaid && (
                        <Link
                          href={`/track/${q.leadId}`}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <Truck className="w-4 h-4 shrink-0" />
                          <span>Track Status</span>
                        </Link>
                      )}
                      
                      {(q.amountDue ?? 0) > 0 && q.isPaid && (
                        <Link
                          href={`/quote/${q.leadId}/review/${q.quoteId}`}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>Pay Balance (Rs. {(q.amountDue ?? 0).toLocaleString('en-IN')})</span>
                        </Link>
                      )}

                      {/* Download Invoice (if paid) */}
                      {q.isPaid && (
                        <a
                          href={`/api/invoice/${q.quoteId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>Tax Invoice</span>
                        </a>
                      )}
                    </div>

                  </div>
                  {/* Payment Stages Timeline */}
                  {q.rawLead && q.rawQuote && (
                    <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                      <PaymentStagesWidget quoteId={q.quoteId} lead={q.rawLead} quote={q.rawQuote} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {visibleBooked < bookedQuotes.length && (
            <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-center">
              <button
                onClick={() => setVisibleBooked(prev => prev + 5)}
                className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Load More Bookings ({bookedQuotes.length - visibleBooked} remaining)
              </button>
            </div>
          )}

          
          {/* Pending Quotations */}
          <div className="bg-zinc-50 dark:bg-zinc-800/20 px-6 py-3 border-y border-zinc-100 dark:border-zinc-800">
             <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                <Clock className="w-4 h-4 text-amber-500" /> Pending Quotations ({unbookedQuotes.length})
             </h3>
          </div>
          
          {unbookedQuotes.length === 0 ? (
            <div className="p-5 md:p-12 text-center border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                No pending quotations.
              </h3>
              <Link
                href="/wizard"
                className="inline-flex items-center gap-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Get Free Instant Quote
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {unbookedQuotes.slice(0, visibleUnbooked).map((q: any) => (
                <div key={q.quoteId} className="p-6 sm:p-8 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    
                    {/* Left Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          {q.quoteId}
                          <button
                            onClick={() => handleCopy(q.quoteId)}
                            title="Copy Quote ID"
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            {copiedId === q.quoteId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>

                        {q.isPaid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            BOOKED / PAID
                          </span>
                        ) : q.status === "site_visit" || q.status === "survey_booked" ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            <Calendar className="w-3.5 h-3.5" />
                            SITE SURVEY SCHEDULED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            ESTIMATE GENERATED
                          </span>
                        )}

                        {q.propertyType && (
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            • {q.propertyType}
                          </span>
                        )}
                        {q.cameraCount ? (
                          <span className="text-xs text-zinc-500 font-bold">
                            • {q.cameraCount} Cameras
                          </span>
                        ) : null}
                      </div>

                      {q.siteAddress && (
                        <div className="flex items-start gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                           <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                           <span>{q.siteAddress}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          {new Date(q.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex flex-col items-end">
                          <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                            ₹{q.totalPayable?.toLocaleString("en-IN") || "—"}
                          </span>
                          {(q.amountDue ?? 0) > 0 && q.isPaid && (
                            <span className="text-[10px] text-red-500 font-bold -mt-0.5">
                              Balance: ₹{(q.amountDue ?? 0).toLocaleString("en-IN")}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                      
                      <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                        {/* Review / View Quote */}
                        <Link
                          href={`/quote/${q.leadId}/review/${q.quoteId}`}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>View Quote</span>
                        </Link>

                        {/* Download Quote */}
                        <a
                          href={`/api/quote/${q.quoteId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Download PDF</span>
                        </a>
                      </div>

                      {/* Track Booking */}
                      {q.isPaid && (
                        <Link
                          href={`/track/${q.leadId}`}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <Truck className="w-4 h-4 shrink-0" />
                          <span>Track Status</span>
                        </Link>
                      )}
                      
                      {(q.amountDue ?? 0) > 0 && q.isPaid && (
                        <Link
                          href={`/quote/${q.leadId}/review/${q.quoteId}`}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>Pay Balance (Rs. {(q.amountDue ?? 0).toLocaleString('en-IN')})</span>
                        </Link>
                      )}

                      {/* Download Invoice (if paid) */}
                      {q.isPaid && (
                        <a
                          href={`/api/invoice/${q.quoteId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>Tax Invoice</span>
                        </a>
                      )}
                    </div>

                  </div>
                  
                  {/* Unbooked Teaser Banner */}
                  <div className="mt-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 sm:p-5 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                          Special Offer 🎉
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Get 2% Instant Discount on Full Payment, or choose Easy EMIs!</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Select a payment plan that fits your budget.</p>
                    </div>
                    <Link
                      href={`/quote/${q.leadId}/review/${q.quoteId}`}
                      className="shrink-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      Select Payment Plan <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {visibleUnbooked < unbookedQuotes.length && (
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button
                onClick={() => setVisibleUnbooked(prev => prev + 5)}
                className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Load More Quotations ({unbookedQuotes.length - visibleUnbooked} remaining)
              </button>
            </div>
          )}

        </div>

        {/* VIP Support Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 shadow-lg">
          <div>
            <h3 className="text-lg sm:text-xl font-black mb-1 sm:mb-2">Need help with your CCTV installation?</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Our engineering coordination desk is available 7 days a week. Call or message us for site survey rescheduling, hardware upgrades, or warranty queries.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href="tel:+917357612865"
              className="flex-1 sm:flex-none text-center bg-white hover:bg-blue-50 text-blue-800 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-black text-xs transition-all shadow"
            >
              Call: +91 73576 12865
            </a>
            <a
              href={`https://wa.me/917357612865?text=${encodeURIComponent("Hi TEAM CCTV, I need support with my CCTV installation.")}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none text-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-black text-xs transition-all shadow flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
