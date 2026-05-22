"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { IndianRupee } from "lucide-react";

export function BudgetSlider() {
  const { selection, updateSelection } = useConfiguratorStore();

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val >= 100000) {
      updateSelection({ max_budget: null });
    } else {
      updateSelection({ max_budget: val });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
          <IndianRupee className="w-3 h-3 text-blue-600" /> Max Budget
        </label>
        <span className="text-[9px] font-black text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
          {selection.max_budget ? `₹${selection.max_budget.toLocaleString()}` : "No Limit"}
        </span>
      </div>
      <div className="pt-2 px-1">
        <input 
          type="range" 
          min="10000" max="100000" step="5000"
          value={selection.max_budget || 100000}
          onChange={handleBudgetChange}
          className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
        />
        <div className="flex justify-between mt-3 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          <span>₹10K</span>
          <span>No Limit</span>
        </div>
      </div>
    </div>
  );
}
