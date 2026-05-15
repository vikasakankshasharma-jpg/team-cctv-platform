"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { Target, IndianRupee, ShieldCheck } from "lucide-react";

export function FocusToggle() {
  const { selection, updateSelection } = useConfiguratorStore();

  return (
    <div className="space-y-5">
      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <Target className="w-3.5 h-3.5 text-blue-600" /> Selection Focus
      </label>
      <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-800/30 p-1.5 rounded-[24px] border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => updateSelection({ focus_point: "price" })}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
            selection.focus_point === "price"
              ? "bg-white dark:bg-zinc-700 shadow-xl text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500"
          }`}
        >
          <IndianRupee className="w-4 h-4" /> Best Price
        </button>
        <button
          onClick={() => updateSelection({ focus_point: "quality" })}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
            selection.focus_point === "quality"
              ? "bg-white dark:bg-zinc-700 shadow-xl text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Quality
        </button>
      </div>
    </div>
  );
}
