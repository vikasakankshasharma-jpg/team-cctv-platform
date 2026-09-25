import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { verifySession } from "@/lib/auth-server";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    redirect("/login");
  }

  if (session.role !== "sales_staff" && session.role !== "super_admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 transition-colors duration-300">
      <header className="bg-white/90 backdrop-blur-xl shadow-xs sticky top-0 z-10 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/sales" className="text-xl font-black text-blue-600 tracking-tight">
              Sales CRM
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/salesperson/route"
              className="text-xs font-bold text-zinc-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-blue-50 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Daily Client Visits</span>
            </Link>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
              {session.role}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {children}
      </main>
    </div>
  );
}
