"use client";

import { useState } from "react";
import { Search, ArrowRight, User, Package, TrendingDown, TrendingUp, ClipboardList } from "lucide-react";
import { PageHeader } from "./PageHeader";

interface AuditLogClientProps {
  initialLogs: any[];
}

export function AuditLogClient({ initialLogs }: AuditLogClientProps) {
  const [filter, setFilter] = useState("");

  const filteredLogs = initialLogs.filter(log => 
    log.product_display_name.toLowerCase().includes(filter.toLowerCase()) ||
    log.changed_by.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        icon={ClipboardList}
        title="Price Change Log"
        description="A full audit trail of every product price modification made by administrators."
        badge={`${initialLogs.length} changes`}
      />

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-6 items-end justify-between px-1">
        <div className="relative flex-1 max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by product or admin email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder-zinc-400 dark:placeholder-zinc-700"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 font-black uppercase text-[10px] tracking-[0.25em]">
              <tr className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Changed By</th>
                <th className="px-6 py-4">Old Price</th>
                <th className="px-6 py-4">New Price</th>
                <th className="px-6 py-4 text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">No price changes recorded yet</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const diff = log.new_price - log.old_price;
                  const isIncrease = diff > 0;
                  
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                              <Package className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{log.product_display_name}</div>
                              <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-1">
                                 {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                           <User className="w-3.5 h-3.5 text-blue-500/50" />
                           {log.changed_by}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-zinc-400 dark:text-zinc-600 font-bold text-lg">₹{log.old_price.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-800" />
                           <span className="text-zinc-900 dark:text-white font-black text-xl tracking-tighter">₹{log.new_price.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${isIncrease ? 'bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 border-emerald-100 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/5 text-red-600 border-red-100 dark:border-red-500/20'}`}>
                           {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                           {isIncrease ? "+" : ""}{diff.toLocaleString('en-IN')}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
