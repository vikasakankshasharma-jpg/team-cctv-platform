import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, RefreshCw, ShieldCheck, CheckCircle2, Clock, AlertCircle, Phone, Mail, MapPin } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = buildPageMetadata("terms_of_service", locale, {
    alternates: { canonical: "https://cctvquotation.com/refund-policy" },
  });
  return {
    title: "Refund, Cancellation & Warranty Policy | CCTVQuotation by Team",
    description: "Official Refund, Cancellation and Warranty Policy for Team (Proprietor: Akanksha Sharma). 100% transparent token refunds and genuine hardware warranties.",
  };
}

export default async function RefundPolicyPage() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-8 md:py-16 md:py-24 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Back to Home</span>
        </Link>

        {/* Hero */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <RefreshCw className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-2 leading-[1.2]">
              Refund & Cancellation Policy
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              Last updated: 15 November 2026 · Governed by Indian Consumer Protection (E-Commerce) Rules 2020
            </p>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12 p-5 sm:p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">100% Booking Refund</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">₹500 advance booking fee is 100% refundable if cancelled before surveyor dispatch.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">DOA / Damaged Box Replacement</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Free immediate on-site replacement if hardware box or seal is damaged upon delivery.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">5–7 Day Bank Payout</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">All approved refunds are credited directly back to the original source UPI/bank account.</p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          <section className="bg-zinc-50/50 dark:bg-zinc-900/20 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              1. Advance Token Booking (₹500)
            </h2>
            <p className="mb-2">
              Customers pay a flat ₹500 booking token to schedule a physical site inspection or lock hardware prices.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Cancellation before surveyor dispatch:</strong> 100% refund of ₹500 with no questions asked.</li>
              <li><strong>Cancellation after surveyor arrival:</strong> If the surveyor completes the physical cable check and custom BOM engineering, the ₹500 is adjusted against the survey and transport fee.</li>
              <li><strong>Adjustment in final invoice:</strong> When the project proceeds, ₹500 is credited in full against the final project total.</li>
            </ul>
          </section>

          <section className="bg-zinc-50/50 dark:bg-zinc-900/20 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              2. Material Delivery & Hardware Handover (Delivery OTP Stage)
            </h2>
            <p className="mb-2">
              CCTV cameras, NVRs/DVRs, and surveillance hard drives are delivered directly to the customer site in original manufacturer boxes.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Inspection before Delivery OTP:</strong> Customers verify brand, model, and serial barcodes before sharing the 6-digit Delivery OTP.</li>
              <li><strong>Transit Damage / Incorrect SKU:</strong> If any item is damaged or incorrect, the installer initiates an immediate free replacement. Do not share the OTP until satisfied.</li>
              <li>Once the Delivery OTP is verified and unboxed cabling begins, physical hardware cannot be returned unless verified as electrically defective under manufacturer warranty.</li>
            </ul>
          </section>

          <section className="bg-zinc-50/50 dark:bg-zinc-900/20 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              3. Post-Installation Workmanship & Warranty (Completion PIN Stage)
            </h2>
            <p className="mb-2">
              Following installation, camera angles, night-vision clarity, and mobile app live streaming are tested jointly with the customer.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Manufacturer Hardware Warranty:</strong> 1 to 3 Years official warranty on cameras, DVR/NVR, and surveillance drives by authorized brand service centers (CP Plus, Hikvision, Dahua).</li>
              <li><strong>TEAM Workmanship Guarantee:</strong> 1 Year on-site free service guarantee on cabling, BNC/DC/PoE terminations, and junction box mounting.</li>
              <li><strong>Exclusions:</strong> Warranty does not cover physical vandalism, cable cutting by rodents/construction, high-voltage electrical surges without earthing, or unauthorized tampering.</li>
            </ul>
          </section>

          <section className="bg-zinc-50/50 dark:bg-zinc-900/20 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              4. Refund Processing Timeline
            </h2>
            <p className="mb-2">
              All approved refunds are initiated through our payment gateway (Razorpay) to the original payment method:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>UPI Payments:</strong> 2 to 4 business days.</li>
              <li><strong>Debit / Credit Cards & NetBanking:</strong> 5 to 7 business days depending on customer bank.</li>
              <li>A digital credit voucher / confirmation is shared instantly on WhatsApp and email.</li>
            </ul>
          </section>

          {/* Statutory Business & Grievance Contact Card */}
          <div className="p-6 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
              Statutory Business & Grievance Redressal
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              For refund status, dispute escalation, or warranty service requests, contact our registered office:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-zinc-900 dark:text-white">Trade Name: Team (Proprietorship)</p>
                <p className="text-zinc-500 dark:text-zinc-400">Proprietor: Akanksha Sharma</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">GSTIN: 08CRVPS7390M1ZF · PAN: CRVPS7390M</p>
                <p className="text-zinc-500 dark:text-zinc-400">Govt. of India Registration: Form GST REG-06</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>no. S1/51, Maheshpuri, Jhotwara, Jaipur, Rajasthan — 302012</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>+91 99825 49315 (Mon–Sat, 9:00 AM – 8:00 PM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>support@cctvquotation.com (SLA: Acknowledged within 24h)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
