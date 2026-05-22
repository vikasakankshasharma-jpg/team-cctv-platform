"use client";

import { Check } from "lucide-react";

interface OptionCardProps {
  label: string;
  isSelected: boolean;
  isMulti?: boolean;
  onClick: () => void;
  prospectiveCount?: number | null;
}

export function OptionCard({ label, isSelected, isMulti, onClick, prospectiveCount }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      role={isMulti ? "checkbox" : "radio"}
      aria-checked={isSelected}
      style={{ minHeight: "64px" }}
      className={[
        // base
        "relative w-full flex items-center gap-5 px-6 py-5 rounded-3xl text-left",
        "cursor-pointer select-none",
        // transition (use CSS var tokens)
        "transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)",
        // selected vs idle
        isSelected
          ? [
              "bg-white",
              "border-[2.5px] border-blue-600",
              "shadow-[0_10px_40px_-10px_rgba(37,99,235,0.2)]",
              "active:scale-[0.98]",
            ].join(" ")
          : [
              "bg-white",
              "border-[2.5px] border-zinc-100",
              "hover:border-zinc-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]",
              "hover:-translate-y-1",
              "active:scale-[0.98]",
            ].join(" "),
      ].join(" ")}
    >
      {/* Icon bubble */}
      <div
        className={[
          "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center",
          "transition-all duration-[250ms] ease-out",
          isSelected
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500",
        ].join(" ")}
      >
        {isSelected ? (
          <Check className="w-4 h-4 stroke-[3px]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-current opacity-30" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span
          className={[
            "block text-[16px] leading-snug tracking-tight",
            "transition-colors duration-300",
            isSelected
              ? "font-black text-blue-900"
              : "font-bold text-zinc-900",
          ].join(" ")}
        >
          {label}
        </span>
        {isMulti && !isSelected && (
          <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
            Tap to select
          </span>
        )}
        {isMulti && isSelected && (
          <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
            ✓ Added
          </span>
        )}
      </div>

      {/* Prospective Count Badge */}
      {prospectiveCount !== undefined && prospectiveCount !== null && (
        <div className={[
          "shrink-0 ml-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-300 shadow-sm",
          prospectiveCount === 0 
            ? "bg-red-50 text-red-500 border border-red-200" 
            : isSelected 
              ? "bg-blue-600 text-white shadow-blue-600/30 border border-blue-600"
              : "bg-white text-blue-600 border border-blue-200"
        ].join(" ")}>
          {prospectiveCount} {prospectiveCount === 1 ? 'Option' : 'Options'}
        </div>
      )}

      {/* Selection ring glow (non-layout) */}
      {isSelected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 -z-10" />
      )}
    </button>
  );
}

