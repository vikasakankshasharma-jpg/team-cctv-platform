import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    redirect("/login");
  }

  // Allow installers and admins
  if (session.role !== "installer" && session.role !== "super_admin" && session.role !== "operations_manager") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 transition-colors duration-300">
      <header className="bg-white/90 backdrop-blur-xl shadow-xs sticky top-0 z-10 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-600 tracking-tight">Field Operations</h1>
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1 rounded-full">
              ID: {session.user?.uid?.substring(0,6)}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
        {children}
      </main>
    </div>
  );
}
