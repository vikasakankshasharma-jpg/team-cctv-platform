"use client";

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { Lead, PricingResult, AppSettings } from '@/types';

interface DownloadQuoteButtonProps {
  lead: Lead;
  quote: PricingResult;
  settings: AppSettings | null;
  className?: string;
}

export function DownloadQuoteButton({ lead, quote, settings, className = "" }: DownloadQuoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleDownload = async () => {
    try {
      setLoading(true);
      const { pdf } = await import('@react-pdf/renderer');
      const { QuotePDFDocument } = await import('./QuotePDFDocument');
      
      const doc = <QuotePDFDocument lead={lead} quote={quote} settings={settings} />;
      const blob = await pdf(doc).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TEAM_CCTV_Quote_${lead.customer_name?.replace(/\s+/g, '_') || 'Customer'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`group px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          {t('quote_download_pdf', 'Download PDF')}
        </>
      )}
    </button>
  );
}
