import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    redirect("/login");
  }

  if (session.role !== "sales_staff" && session.role !== "super_admin") {
    // Unauthorized users (like customers or installers) should not see this layout
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 transition-colors duration-300">
      <header className="bg-white/90 backdrop-blur-xl shadow-xs sticky top-0 z-10 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-600 tracking-tight">Sales CRM</h1>
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Role: {session.role}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
