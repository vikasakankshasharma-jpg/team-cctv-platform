"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { Target, IndianRupee, ShieldCheck } from "lucide-react";

export function FocusToggle() {
  const { selection, updateSelection } = useConfiguratorStore();

  return (
    <div className="flex items-center gap-2">
      <label className="hidden sm:flex text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] items-center gap-1.5 mr-2">
        <Target className="w-3 h-3 text-blue-600" /> Focus
      </label>
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
        <button
          onClick={() => updateSelection({ focus_point: "price" })}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            selection.focus_point === "price"
              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <IndianRupee className="w-3 h-3" /> Best Price
        </button>
        <button
          onClick={() => updateSelection({ focus_point: "quality" })}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            selection.focus_point === "quality"
              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <ShieldCheck className="w-3 h-3" /> Quality
        </button>
      </div>
    </div>
  );
}
