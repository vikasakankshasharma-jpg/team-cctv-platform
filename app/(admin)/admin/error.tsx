"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center p-6">
      <div className="flex max-w-lg flex-col items-center justify-center rounded-3xl bg-white dark:bg-zinc-900 p-8 text-center shadow-lg border border-zinc-200 dark:border-zinc-800">
        <div className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/40 p-4 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>
        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.25em] mb-1">
          Admin Portal Error
        </span>
        <h2 className="mb-2 font-black tracking-tight text-2xl text-zinc-900 dark:text-white">
          Failed to load resource
        </h2>
        <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
          {error.message || "An unexpected error occurred while rendering this section."}
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-sm"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => { window.location.href = "/admin/leads"; }}
            className="text-xs font-bold rounded-xl"
          >
            Back to Leads
          </Button>
        </div>
      </div>
    </div>
  );
}
