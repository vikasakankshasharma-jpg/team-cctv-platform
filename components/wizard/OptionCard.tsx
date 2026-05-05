"use client";

import { Check } from "lucide-react";

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
      role={isMulti ? "checkbox" : "radio"}
      aria-checked={isSelected}
      style={{ minHeight: "64px" }}
      className={[
        // base
        "relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left",
        "cursor-pointer select-none",
        // transition (use CSS var tokens)
        "transition-all duration-[250ms] ease-out",
        // selected vs idle
        isSelected
          ? [
              "bg-blue-50 dark:bg-blue-600/10",
              "border-2 border-blue-600",
              "shadow-[0_0_0_4px_rgba(37,99,235,0.10)]",
            ].join(" ")
          : [
              "bg-white dark:bg-zinc-900/50",
              "border-2 border-zinc-100 dark:border-zinc-800",
              "hover:border-zinc-300 dark:hover:border-zinc-700",
              "hover:shadow-md hover:-translate-y-[2px]",
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
            "block text-[0.9375rem] leading-snug",
            "transition-colors duration-[150ms]",
            isSelected
              ? "font-semibold text-blue-700 dark:text-blue-300"
              : "font-medium text-zinc-700 dark:text-zinc-300",
          ].join(" ")}
        >
          {label}
        </span>
        {isMulti && !isSelected && (
          <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">
            Tap to select
          </span>
        )}
        {isMulti && isSelected && (
          <span className="block text-[10px] font-semibold text-blue-500 uppercase tracking-widest mt-0.5">
            ✓ Added
          </span>
        )}
      </div>

      {/* Selection ring glow (non-layout) */}
      {isSelected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 -z-10" />
      )}
    </button>
  );
}

