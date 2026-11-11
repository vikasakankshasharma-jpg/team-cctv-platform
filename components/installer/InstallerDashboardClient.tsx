"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle, Clock, Wallet, Navigation, ArrowRight, MapPin } from "lucide-react";
import { InstallerPipeline } from "./InstallerPipeline";
import { useTranslation } from "@/hooks/useTranslation";
import type { Lead } from "@/types";

interface InstallerDashboardClientProps {
  installerId: string;
  installerName: string;
  walletBalance: number;
  slaScore: number;
  jobsCompleted: number;
  activeLeads: Lead[];
}

export function InstallerDashboardClient({
  installerId,
  installerName,
  walletBalance,
  slaScore,
  jobsCompleted,
  activeLeads,
}: InstallerDashboardClientProps) {
  const { t } = useTranslation();
  const displayName = !installerName || installerName === "Installer" ? t("inst_fallback_name", "Installer") : installerName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t("inst_dash_welcome", "Welcome back, {name}", { name: displayName })}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("inst_dash_sub", "Here is your field operations overview and urgent broadcasts.")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("inst_dash_active_jobs", "Active Jobs")}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {activeLeads.filter(l => l.assigned_installer_id === installerId).length}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("inst_dash_wallet", "Wallet Balance")}</p>
          </div>
          <p className={`text-2xl font-bold ${walletBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ₹{walletBalance.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("inst_prof_sla", "SLA Score")}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {slaScore}/100
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("inst_dash_completed", "Completed")}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {jobsCompleted}
          </p>
        </div>
      </div>

      {/* ── DAILY ROUTE BANNER ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-white/20 text-white shrink-0">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-base font-black">{t("inst_dash_route_title", "Daily Route & Schedule Planner")}</h2>
          </div>
          <p className="text-xs text-blue-100 max-w-xl">
            {t("inst_dash_route_desc", "Sequence your customer visits, auto-optimize drive routes for the day, and navigate using multi-stop Google Maps.")}
          </p>
        </div>
        <Link
          href="/installer/route"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-sm hover:bg-blue-50 transition-all shrink-0 active:scale-98 whitespace-normal h-auto text-center"
        >
          <span>{t("inst_dash_route_btn", "Open Daily Route")}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>

      {/* Leads Pipeline */}
      <InstallerPipeline 
        leads={activeLeads} 
        partnerId={installerId}
        role="installer"
      />
    </div>
  );
}
