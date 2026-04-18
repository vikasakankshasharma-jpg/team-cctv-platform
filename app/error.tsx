"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, ShieldAlert, WifiOff } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Audit the system fault for post-incident analysis
    console.error("System Fault Detected:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 transition-colors duration-500 overflow-hidden relative">
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 dark:bg-red-600/10 rounded-full blur-[130px] animate-pulse" />
      </div>

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      <div className="relative z-10 text-center max-w-lg">
        
        {/* Warning Icon Wrapper */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          <div className="absolute inset-0 bg-red-600/10 dark:bg-red-600/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500 animate-pulse" />
            
            {/* Warning pings */}
            <div className="absolute inset-0 rounded-[40px] border border-red-500/30 animate-ping opacity-20" />
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">System Fault Detected</span>
          </div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
            Soft <span className="text-red-600 dark:text-red-500">Reboot</span> Required.
          </h1>
          <p className="text-zinc-500 dark:text-zinc-500 font-medium text-lg leading-relaxed lowercase">
            The intelligent pipeline encountered a non-deterministic state. Orchestration suspended.
          </p>
          
          <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-mono text-[11px] text-zinc-400 text-left overflow-x-auto shadow-inner">
             <p className="text-red-500/70 dark:text-red-400/50 mb-1 tracking-tighter uppercase font-black">Exception Log Instance:</p>
             {error.message || "Unknown tactical error encountered in the core logic."}
             {error.digest && <p className="mt-2 text-zinc-600 dark:text-zinc-700">Digest: {error.digest}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => reset()}
            className="group relative flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-10 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Initialize Soft Reboot
          </button>
          
          <p className="text-zinc-400 dark:text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-4">
            Incident reports are automatically logged for the engineering squad.
          </p>
        </div>
      </div>

      {/* Footer Signature */}
      <div className="absolute bottom-10 text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-[0.4em] pointer-events-none">
        Elite System Integrity Protocol
      </div>
    </div>
  );
}
