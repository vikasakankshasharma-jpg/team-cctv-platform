"use client";

import { useState } from "react";
import { Activity, CheckCircle, Clock, Wallet } from "lucide-react";
import { InstallerPipeline } from "./InstallerPipeline";
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome back, {installerName}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Here is your field operations overview and urgent broadcasts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Active Jobs</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {activeLeads.filter(l => l.assigned_installer_id === installerId).length}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Wallet Balance</p>
          </div>
          <p className={`text-2xl font-bold ${walletBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ₹{walletBalance.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">SLA Score</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {slaScore}/100
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Completed</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {jobsCompleted}
          </p>
        </div>
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
