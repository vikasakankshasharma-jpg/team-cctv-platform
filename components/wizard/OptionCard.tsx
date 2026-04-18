"use client";

import { Check, ShieldCheck } from "lucide-react";

interface OptionCardProps {
  label: string;
  isSelected: boolean;
  isMulti?: boolean;
  onClick: () => void;
}

export function OptionCard({ label, isSelected, isMulti, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-4 p-5 rounded-3xl text-left transition-all duration-300 group
        ${isSelected 
          ? "bg-blue-600/5 dark:bg-blue-600/10 border-2 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.1)] ring-1 ring-blue-600/20" 
          : "bg-white dark:bg-zinc-900/40 border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:-translate-y-0.5 shadow-sm"
        }
      `}
    >
      <div className={`
        w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0
        ${isSelected 
          ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30 rotate-0" 
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 -rotate-12 group-hover:rotate-0"
        }
      `}>
        {isSelected ? (
          <Check className="w-5 h-5 stroke-[4px]" />
        ) : (
          <ShieldCheck className="w-5 h-5 opacity-40 group-hover:opacity-100" />
        )}
      </div>

      <div className="flex-1">
        <span className={`text-base font-black transition-colors ${isSelected ? "text-blue-700 dark:text-white" : "text-zinc-700 dark:text-zinc-400"}`}>
          {label}
        </span>
        {isMulti && !isSelected && (
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Select multiple</div>
        )}
      </div>

      {isSelected && (
        <div className="absolute top-8 right-8 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tight z-20">
          Selected
        </div>
      )}
      
      {/* Subtle selection glow for dark mode */}
      {isSelected && <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 -z-10 blur-xl" />}
    </button>
  );
}
