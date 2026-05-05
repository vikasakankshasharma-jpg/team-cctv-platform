"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render nothing until client-side
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div
        className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "group relative w-10 h-10 rounded-2xl flex items-center justify-center",
        "border transition-all duration-200",
        "hover:shadow-lg active:scale-90 touch-manipulation",
        isDark
          ? "bg-zinc-900 border-zinc-700 hover:border-blue-400/60"
          : "bg-white border-zinc-200 hover:border-blue-500/50",
      ].join(" ")}
    >
      <div className="relative w-5 h-5">
        {/* Sun — visible in light mode */}
        <Sun
          className={[
            "absolute inset-0 w-5 h-5 text-amber-500",
            "transition-all duration-300",
            isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100",
          ].join(" ")}
        />
        {/* Moon — visible in dark mode */}
        <Moon
          className={[
            "absolute inset-0 w-5 h-5 text-blue-400",
            "transition-all duration-300",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
          ].join(" ")}
        />
      </div>

      {/* Hover glow */}
      <div
        className={[
          "absolute inset-[-4px] rounded-[24px] blur-xl opacity-0",
          "group-hover:opacity-25 transition-opacity pointer-events-none",
          isDark ? "bg-blue-400" : "bg-amber-400",
        ].join(" ")}
      />
    </button>
  );
}

