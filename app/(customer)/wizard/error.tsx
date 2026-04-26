"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function WizardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Wizard Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-8 animate-pulse">
        <AlertCircle className="w-10 h-10" />
      </div>
      
      <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">
        Something went wrong
      </h2>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-12 font-medium leading-relaxed">
        We encountered a synchronization error while building your quote. Please try resetting the wizard or returning home.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={() => reset()}
          className="flex-1 flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
        
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
