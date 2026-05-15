"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { ShieldCheck } from "lucide-react";

export function BrandSelector({ brands }: { brands: string[] }) {
  const { selection, updateSelection } = useConfiguratorStore();

  return (
    <div className="space-y-5">
      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Preferred Brand
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateSelection({ brand_preference: "all" })}
          className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            !selection.brand_preference || selection.brand_preference === "all"
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
          }`}
        >
          All Brands
        </button>
        {brands.map(brand => (
          <button
            key={brand}
            onClick={() => updateSelection({ brand_preference: brand })}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selection.brand_preference === brand
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
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
