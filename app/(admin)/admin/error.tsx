"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("[Admin Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center p-6">
      <div className="flex max-w-lg flex-col items-center justify-center rounded-3xl bg-white dark:bg-zinc-900 p-8 text-center shadow-lg border border-zinc-200 dark:border-zinc-800">
        <div className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/40 p-4 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>
        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-1 leading-snug">
          {t("adm_err_badge", "Admin Portal Error")}
        </span>
        <h2 className="mb-2 font-black tracking-tight text-2xl text-zinc-900 dark:text-white leading-snug">
          {t("adm_err_title", "Failed to load resource")}
        </h2>
        <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
          {error.message || t("adm_err_desc", "An unexpected error occurred while rendering this section.")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs uppercase tracking-wider px-6 py-2.5 h-auto whitespace-normal leading-snug rounded-xl shadow-sm"
          >
            <RefreshCcw className="w-3.5 h-3.5 shrink-0" />
            <span>{t("adm_err_retry", "Try Again")}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => { window.location.href = "/admin/leads"; }}
            className="text-xs font-bold rounded-xl h-auto py-2.5 px-4 whitespace-normal leading-snug"
          >
            {t("adm_err_back_leads", "Back to Leads")}
          </Button>
        </div>
      </div>
    </div>
  );
}
