"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";

interface TerritoryStat {
  pincode: string;
  total_leads: number;
  won_leads: number;
  revenue: number;
  has_franchise: boolean;
}

export function TerritoryAudit() {
  const [data, setData] = useState<TerritoryStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/territory")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="h-64 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Aggregating Geo-Intelligence...</p>
    </div>
  );

  const topGapZones = data.filter(s => !s.has_franchise).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Top 5 Coverage Gaps */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
             <AlertCircle className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Coverage Gap Audit</h3>
             <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">High volume zones with no assigned franchise</p>
           </div>
        </div>

        <div className="space-y-3">
          {topGapZones.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-xs font-bold uppercase tracking-widest">Global Coverage Secured</div>
          ) : (
            topGapZones.map(zone => (
              <div key={zone.pincode} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl group hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-900 dark:text-white shadow-inner">
                    {zone.pincode}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Leads in Queue</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-white">{zone.total_leads}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black px-3 py-1 bg-amber-50 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/10 rounded-full uppercase tracking-widest">Action Required</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top 5 High Performance Zones */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
             <TrendingUp className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Performance Matrix</h3>
             <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Top-performing territories by revenue & conversion</p>
           </div>
        </div>

        <div className="space-y-3">
          {data.slice(0, 5).map(zone => (
            <div key={zone.pincode} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-900 dark:text-white shadow-inner">
                  {zone.pincode}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Conversion Efficiency</span>
                  <span className="text-sm font-black text-emerald-600">
                    {zone.total_leads > 0 ? Math.round((zone.won_leads / zone.total_leads) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] font-black text-zinc-900 dark:text-white tabular-nums leading-none mb-1">₹{(zone.revenue / 1000).toFixed(1)}k</span>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Gross Yield</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
