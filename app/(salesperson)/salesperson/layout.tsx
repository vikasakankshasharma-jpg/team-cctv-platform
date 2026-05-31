import { verifySession } from "@/lib/auth-server";
import { Sidebar } from "@/components/salesperson/Sidebar";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";

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
    <div className="dark flex h-screen bg-[#030303] overflow-hidden font-sans text-white transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="hidden md:flex h-20 border-b border-white/5 bg-black/20 backdrop-blur-3xl items-center justify-between px-10 z-20 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-900/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Portal Active</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                Sales Portal / <span className="text-white/80">v1.0.0</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-2 px-4 backdrop-blur-md hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-amber-400 transition-colors">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white leading-none">
                  {session.user?.email || "Sales Agent"}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-500 mt-1">
                  Sales Agent
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-18 md:pt-4 lg:pt-8 relative">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
