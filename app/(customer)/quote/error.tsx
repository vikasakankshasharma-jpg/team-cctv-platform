"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, FileQuestion, Loader2 } from "lucide-react";
import Link from "next/link";

export default function QuoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [autoSyncing, setAutoSyncing] = useState(true);

  useEffect(() => {
    console.error("Quote Manifest Error:", error);
    
    // Auto-retry logic
    const retryCount = parseInt(sessionStorage.getItem("quote_error_retries") || "0");
    
    if (retryCount < 2) {
      sessionStorage.setItem("quote_error_retries", (retryCount + 1).toString());
      // Wait a brief moment before retrying to let temporary issues resolve
      const timer = setTimeout(() => {
        reset();
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      // Exceeded max retries, show error screen
      setAutoSyncing(false);
      // Clear retries so user can manually retry again later
      sessionStorage.removeItem("quote_error_retries");
    }
  }, [error, reset]);

  if (autoSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-600/10 rounded-[32px] flex items-center justify-center text-blue-600 dark:text-blue-500 mb-10 shadow-2xl">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        
        <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4 animate-pulse">
          Auto-Syncing Data...
        </h2>
        
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm font-medium leading-relaxed">
          Retrieving the latest quotation securely. Please wait a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-24 h-24 bg-blue-50 dark:bg-blue-600/10 rounded-[32px] flex items-center justify-center text-blue-600 dark:text-blue-500 mb-10 shadow-2xl">
        <ShieldAlert className="w-12 h-12" />
      </div>
      
      <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6">
        Manifest Loading Failure
      </h2>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mb-16 font-medium leading-relaxed">
        Our system failed to retrieve your specific quotation manifest. This usually happens if the link is expired or the database is under maintenance.
      </p>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
        <button
          onClick={() => {
            sessionStorage.removeItem("quote_error_retries"); // Reset counter for manual retry
            reset();
          }}
          className="flex-1 flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          Re-Sync Data
        </button>
        
        <Link
          href="/wizard"
          className="flex-1 flex items-center justify-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white px-10 py-5 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-lg transition-all active:scale-95"
        >
          <FileQuestion className="w-5 h-5" />
          New Quote
        </Link>
      </div>
      
      <div className="mt-20 pt-10 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-sm">
         <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">TEAM Security Systems Operational Node</p>
      </div>
    </div>
  );
}
