"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { Camera } from "lucide-react";

export function ResolutionSelector({ resolutions }: { resolutions: string[] }) {
  const { selection, updateSelection } = useConfiguratorStore();

  const options = ["all", ...resolutions];
  
  const currentIndex = selection.resolution_preference 
    ? options.indexOf(selection.resolution_preference)
    : 0;

  const validIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    const selectedRes = options[val];
    updateSelection({ resolution_preference: selectedRes === "all" ? "all" : selectedRes });
  };

  const displayValue = validIndex === 0 ? "Any" : options[validIndex];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-blue-600" /> Min Resolution
        </label>
        <span className="text-[9px] font-black text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
          {displayValue}
        </span>
      </div>
      <div className="pt-2 px-1">
        <input 
          type="range" 
          min="0" 
          max={options.length - 1} 
          step="1"
          value={validIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
        />
        <div className="flex justify-between mt-3 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          <span>Any</span>
          <span>{options[options.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}
