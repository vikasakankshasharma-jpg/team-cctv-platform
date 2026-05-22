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
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => updateSelection({ brand_preference: "all" })}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            !selection.brand_preference || selection.brand_preference === "all"
              ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
          }`}
        >
          All Brands
        </button>
        {brands.map(brand => (
          <button
            key={brand}
            onClick={() => updateSelection({ brand_preference: brand })}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              selection.brand_preference === brand
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {brand}
          </button>
        ))}
      </div>
    </div>
  );
}
