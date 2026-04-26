"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="group relative w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-all hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-lg active:scale-90"
      title={`Toggle Theme (Current: ${theme})`}
    >
      <div className="relative w-5 h-5">
        <Sun className="absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      </div>
      
      {/* Decorative Blur Glow */}
      <div className={`absolute inset-[-4px] rounded-[24px] blur-xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${resolvedTheme === 'dark' ? 'bg-blue-400' : 'bg-amber-400'}`} />
    </button>
  );
}
