"use client";

import { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export function CatalogRepairButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; total: number } | null>(null);
  const router = useRouter();

  const runRepair = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog-repair", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setResult({
          updated: data.summary.updated,
          total: data.summary.total_documents,
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Repair failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex items-center gap-2 text-emerald-500 animate-in zoom-in duration-300">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {t("adm_cat_fixed", { count: String(result.updated) })}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={runRepair}
      disabled={loading}
      className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          <span className="whitespace-normal leading-snug">{t("adm_cat_processing")}</span>
        </>
      ) : (
        <>
          <Database className="w-3 h-3 shrink-0" />
          <span className="whitespace-normal leading-snug">{t("adm_cat_run_script")}</span>
        </>
      )}
    </button>
  );
}
