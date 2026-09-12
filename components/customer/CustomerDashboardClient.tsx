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
} from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";

export interface CustomerQuoteItem {
  quoteId: string;
  leadId: string;
  createdAt: string;
  totalPayable: number;
  status: string;
  cameraCount?: number;
  propertyType?: string;
  isPaid: boolean;
  customerName?: string;
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
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [loggingOut, setLoggingOut] = useState(false);

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

  const filteredQuotes = quotes.filter((q) => {
    if (filter === "PAID") return q.isPaid;
    if (filter === "PENDING") return !q.isPaid;
    return true;
  });

  const totalQuotesCount = quotes.length;
  const paidQuotesCount = quotes.filter((q) => q.isPaid).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Bar: Profile & Logout */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {(user.name || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  {user.name || "Valued Client"}
                </h1>
                <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                  Customer
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                {user.mobile ? `+91 ${user.mobile}` : "Authenticated Customer"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/wizard"
              className="flex-1 sm:flex-none text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              + New Quotation
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? "Signing out..." : "Log Out"}</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Total Quotations</span>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {totalQuotesCount}
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Lifetime generated estimates</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Booked Installations</span>
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {paidQuotesCount}
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Orders confirmed with advance payment</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Tax Invoices</span>
              <Download className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {paidQuotesCount}
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Official GST tax invoices available</p>
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
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === "ALL" 
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-white shadow-sm font-black" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                All ({totalQuotesCount})
              </button>
              <button
                onClick={() => setFilter("PAID")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === "PAID" 
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-black" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Booked ({paidQuotesCount})
              </button>
              <button
                onClick={() => setFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === "PENDING" 
                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm font-black" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Unpaid ({totalQuotesCount - paidQuotesCount})
              </button>
            </div>
          </div>

          {/* Quotations List */}
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                No quotations found
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                You haven't generated any quotations under this status yet. Configure your custom CCTV package now!
              </p>
              <Link
                href="/wizard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Get Free Instant Quote
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredQuotes.map((q) => (
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
                        <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                          ₹{q.totalPayable?.toLocaleString("en-IN") || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                      
                      {/* Review / View Quote */}
                      <Link
                        href={`/quote/${q.leadId}/review/${q.quoteId}`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all"
                      >
                        <FileText className="w-4 h-4 text-zinc-500" />
                        <span>View Quote</span>
                      </Link>

                      {/* Download Quote */}
                      <a
                        href={`/api/quote/${q.quoteId}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all"
                      >
                        <Download className="w-4 h-4 text-zinc-500" />
                        <span>Download PDF</span>
                      </a>

                      {/* Track Booking */}
                      <Link
                        href={`/track/${q.leadId}`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-black transition-all"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Track Status</span>
                      </Link>

                      {/* Download Invoice (if paid) */}
                      {q.isPaid && (
                        <a
                          href={`/api/invoice/${q.quoteId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Tax Invoice</span>
                        </a>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VIP Support Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-xl font-black mb-1">Need help with your CCTV installation?</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Our engineering coordination desk is available 7 days a week. Call or message us for site survey rescheduling, hardware upgrades, or warranty queries.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="tel:+917357612865"
              className="flex-1 sm:flex-none text-center bg-white hover:bg-blue-50 text-blue-800 px-5 py-3 rounded-xl font-black text-xs transition-all shadow"
            >
              Call: +91 73576 12865
            </a>
            <a
              href={`https://wa.me/917357612865?text=${encodeURIComponent("Hi TEAM CCTV, I need support with my CCTV installation.")}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none text-center bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs transition-all shadow flex items-center justify-center gap-1.5"
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
