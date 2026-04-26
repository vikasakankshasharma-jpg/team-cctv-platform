"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCw, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function QuoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Quote Manifest Error:", error);
  }, [error]);

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
          onClick={() => reset()}
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
