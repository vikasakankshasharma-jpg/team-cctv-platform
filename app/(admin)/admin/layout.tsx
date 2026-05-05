import { verifySession } from "@/lib/auth-server";
import { Sidebar } from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hard check on the server rendering side. 
  // We bypass this check for the login page to avoid redirect loops.
  // Note: Middleware handles the primary protection.
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    // We only reach this state for the /admin/login page
    // (Middleware redirects all other unauthenticated paths to login)
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-10 z-20 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-950/5 dark:shadow-emerald-950/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">System Operational</span>
             </div>
             <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
             <div className="text-zinc-400 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                Command Centre / <span className="text-zinc-900 dark:text-zinc-300">v2.4.0</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl py-2 px-4 shadow-xl dark:shadow-none backdrop-blur-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
              <div className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white leading-none">
                  {session.user?.email}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-500 mt-1">
                  {session.role?.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
