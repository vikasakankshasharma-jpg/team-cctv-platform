"use client";

import { type LucideIcon, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  action?: React.ReactNode;
}

/**
 * Elite reusable page header for all admin catalog/management pages.
 * Fully optimized for Dual-Mode (Day & Night).
 */
export function PageHeader({ icon: Icon, title, description, badge, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-8 mb-8 border-b border-zinc-200 dark:border-zinc-800/60">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20 shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight leading-none uppercase">{title}</h1>
            {badge && (
              <span className="text-[8px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full shadow-inner">
                {badge}
              </span>
            )}
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">{description}</p>
        </div>
      </div>
      
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
