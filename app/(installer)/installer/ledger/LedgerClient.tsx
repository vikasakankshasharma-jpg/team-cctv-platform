"use client";

import { Wallet, ArrowDownToLine, ArrowUpFromLine, AlertCircle, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { LedgerTransaction, Installer } from "@/types";

interface LedgerClientProps {
  installer: Installer;
  balance: number;
  transactions: LedgerTransaction[];
}

export function LedgerClient({ installer, balance, transactions }: LedgerClientProps) {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Ledger
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Track your cash collected on-site against your earnings and hardware deposits. All payouts are settled manually by the administration team.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-zinc-500 mb-1">Current Ledger Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              ₹{Math.abs(balance).toLocaleString("en-IN")}
            </span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${balance >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
              {balance >= 0 ? "CREDIT" : "DUE TO ADMIN"}
            </span>
          </div>
          {balance < 0 && (
            <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> You owe the platform. Please settle to receive new jobs.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-black tracking-tight text-zinc-900 dark:text-white">Recent Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm font-medium">
            No transactions found yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    ["payout", "deposit"].includes(tx.type) ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {["payout", "deposit"].includes(tx.type) ? <ArrowUpFromLine className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{tx.description}</p>
                    <p className="text-xs font-medium text-zinc-500 capitalize mt-0.5">
                      {tx.type.replace("_", " ")} {tx.job_id && <span className="text-zinc-400 ml-1">• Job: {tx.job_id.slice(0, 6)}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black tracking-tight ${
                    ["payout", "deposit"].includes(tx.type) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {["payout", "deposit"].includes(tx.type) ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
                    {tx.created_at ? formatDistanceToNow((tx.created_at as any).toDate?.() || new Date(), { addSuffix: true }) : "Just now"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
