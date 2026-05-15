"use client";

import { Search, Command, UserCheck } from "lucide-react";
import { useOmniSearchStore } from "@/store/omni-search";

interface AdminHeaderProps {
  userEmail: string;
  userRole: string;
}

export function AdminHeader({ userEmail, userRole }: AdminHeaderProps) {
  const { setIsOpen } = useOmniSearchStore();

  return (
    <header className="h-20 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-10 z-20 shrink-0">
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-950/5 dark:shadow-emerald-950/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">System Operational</span>
         </div>
         <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
         
         {/* Global Search Trigger */}
         <button 
           onClick={() => setIsOpen(true)}
           className="flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all group"
         >
           <Search className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">Search Console...</span>
           <div className="flex items-center gap-1 ml-4 px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[8px] font-black opacity-50 group-hover:opacity-100 transition-opacity">
              <Command className="w-2.5 h-2.5" /> K
           </div>
         </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl py-2 px-4 shadow-xl dark:shadow-none backdrop-blur-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
          <div className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-zinc-900 dark:text-white leading-none">
              {userEmail}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-500 mt-1">
              {userRole?.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
