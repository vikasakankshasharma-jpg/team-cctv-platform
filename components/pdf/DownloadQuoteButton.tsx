"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Download, Loader2 } from 'lucide-react';
import type { Lead, PricingResult, AppSettings } from '@/types';

// We dynamically import PDFDownloadLink to prevent SSR hydration mismatches
// since PDF blob generation relies on browser APIs and layout calculations.
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button disabled className="w-full sm:w-auto px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparing PDF...
      </button>
    )
  }
);

// We must also dynamically import the document component itself just in case
const QuotePDFDocument = dynamic(
  () => import('./QuotePDFDocument').then((mod) => mod.QuotePDFDocument),
  { ssr: false }
);

interface DownloadQuoteButtonProps {
  lead: Lead;
  quote: PricingResult;
  settings: AppSettings | null;
  className?: string;
}

export function DownloadQuoteButton({ lead, quote, settings, className = "" }: DownloadQuoteButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button disabled className={`px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full font-semibold flex items-center justify-center gap-2 cursor-not-allowed ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<QuotePDFDocument lead={lead} quote={quote} settings={settings} />}
      fileName={`TEAM_CCTV_Quote_${lead.customer_name?.replace(/\s+/g, '_') || 'Customer'}.pdf`}
      className={`group px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95 ${className}`}
    >
      {({ blob, url, loading, error }) =>
        loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            Download PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
