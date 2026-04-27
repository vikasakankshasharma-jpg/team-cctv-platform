"use client";

import { useMemo } from "react";

interface DataPoint {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
}

export function AnalyticsChart({ data, title, color = "bg-blue-600" }: AnalyticsChartProps) {
  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(d => d.value));
    return max === 0 ? 1 : max;
  }, [data]);

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 backdrop-blur-md shadow-xl overflow-hidden group">
      <div className="flex items-center justify-between mb-10">
         <div>
            <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-1">{title}</h3>
            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Velocity Matrix (14 Cycles)</p>
         </div>
         <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-full text-[8px] font-black text-zinc-400 uppercase tracking-widest">
            Real-time Feed
         </div>
      </div>

      <div className="relative h-48 flex items-end gap-2 group/chart">
        {/* Horizontal Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
           {[...Array(4)].map((_, i) => (
              <div key={i} className="w-full h-px bg-zinc-100 dark:bg-zinc-800/50" />
           ))}
        </div>

        {data.map((point, i) => {
          const heightPercent = (point.value / maxValue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group/bar relative">
              <div className="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 pointer-events-none z-10">
                 <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 rounded-xl font-black text-[10px] shadow-2xl whitespace-nowrap">
                    ₹{point.value.toLocaleString()}
                 </div>
              </div>
              
              <div 
                className={`w-full ${color} dark:brightness-110 rounded-t-lg transition-all duration-1000 ease-out shadow-lg group-hover/bar:brightness-125`}
                style={{ height: `${Math.max(4, heightPercent)}%` }}
              />
              
              <span className="text-[8px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-tighter vertical-text origin-center rotate-45 mt-2">
                 {point.date.split('-').slice(1).join('/')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
