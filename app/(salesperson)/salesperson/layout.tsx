import { verifySession } from "@/lib/auth-server";
import { Sidebar } from "@/components/salesperson/Sidebar";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const metadata = {
  manifest: "/manifest-salesperson.json",
  title: "Sales Portal | TEAM CCTV"
};

export default async function SalespersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  if (!session.isAuthenticated || (session.role !== "sales_staff" && session.role !== "super_admin")) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] dark:bg-[#030303] overflow-hidden font-sans text-zinc-900 dark:text-white transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="hidden md:flex h-16 border-b border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Portal Active</span>
             </div>
             <div className="h-4 w-px bg-zinc-200 dark:bg-white/10" />
             <div className="text-zinc-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                Sales Portal / <span className="text-zinc-800 dark:text-white/80">v1.0.0</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl py-1.5 px-3.5 shadow-xs hover:border-zinc-300 dark:hover:border-white/20 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-white/5 flex items-center justify-center text-blue-600 dark:text-white/50 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-white leading-none">
                  {session.user?.email || "Sales Agent"}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 mt-0.5">
                  Sales Agent
                </span>
              </div>
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-18 md:pt-4 lg:pt-8 relative bg-[#F8F9FA] dark:bg-[#030303]">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
