"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface OptionCardProps {
  label: string;
  isSelected: boolean;
  isMulti?: boolean;
  onClick: () => void;
  prospectiveCount?: number | null;
  isDisabled?: boolean;
}

export function OptionCard({ label, isSelected, isMulti, onClick, prospectiveCount, isDisabled = false }: OptionCardProps) {
  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      role={isMulti ? "checkbox" : "radio"}
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      style={{ minHeight: "64px" }}
      className={[
        // base
        "relative w-full flex items-center gap-5 px-6 py-5 rounded-3xl text-left",
        "select-none backdrop-blur-sm",
        isDisabled ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer",
        // transition
        "transition-colors duration-300",
        // selected vs idle vs disabled
        isSelected && !isDisabled
          ? [
              "bg-white/90 dark:bg-zinc-800/90",
              "border-[2.5px] border-blue-600",
              "shadow-[0_10px_40px_-10px_rgba(37,99,235,0.25)]",
            ].join(" ")
          : isDisabled 
            ? "bg-zinc-50/50 dark:bg-zinc-900/50 border-[2.5px] border-zinc-200/50 dark:border-zinc-800/50"
            : [
                "bg-white/70 dark:bg-zinc-900/70",
                "border-[2.5px] border-zinc-100 dark:border-zinc-800",
                "hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]",
              ].join(" "),
      ].join(" ")}
    >
      {/* Icon bubble */}
      <motion.div
        animate={isSelected && !isDisabled ? { scale: 1.1 } : { scale: 1 }}
        className={[
          "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center",
          "transition-colors duration-300",
          isSelected && !isDisabled
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500",
        ].join(" ")}
      >
        {isSelected ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <Check className="w-4 h-4 stroke-[3px]" />
          </motion.div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-current opacity-30" />
        )}
      </motion.div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span
          className={[
            "block text-[16px] leading-snug tracking-tight",
            "transition-colors duration-300",
            isSelected && !isDisabled
              ? "font-black text-blue-900 dark:text-white"
              : "font-bold text-zinc-900 dark:text-zinc-100",
          ].join(" ")}
        >
          {label}
        </span>
        {isDisabled && (
          <span className="block text-[10px] font-bold text-zinc-500 mt-1">
            Not available with current selection
          </span>
        )}
        {isMulti && !isSelected && !isDisabled && (
          <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
            Tap to select
          </span>
        )}
        {isMulti && isSelected && !isDisabled && (
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
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700" 
            : isSelected 
              ? "bg-blue-600 text-white shadow-blue-600/30 border border-blue-600"
              : "bg-white dark:bg-zinc-900 text-blue-600 border border-blue-200 dark:border-blue-900/50"
        ].join(" ")}>
          {prospectiveCount} {prospectiveCount === 1 ? 'Option' : 'Options'}
        </div>
      )}

      {/* Selection ring glow (non-layout) */}
      {isSelected && !isDisabled && (
        <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-blue-500/5 dark:bg-blue-500/10 -z-10" />
      )}
    </motion.button>
  );
}

