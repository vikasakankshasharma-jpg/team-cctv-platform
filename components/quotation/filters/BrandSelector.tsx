"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { ShieldCheck } from "lucide-react";

export function BrandSelector({ brands }: { brands: string[] }) {
  const { selection, updateSelection } = useConfiguratorStore();

  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-blue-600" /> Preferred Brand
      </label>
      <div className="relative">
        <select
          value={selection.brand_preference || "all"}
          onChange={(e) => updateSelection({ brand_preference: e.target.value })}
          className="appearance-none w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
        >
          <option value="all">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}
