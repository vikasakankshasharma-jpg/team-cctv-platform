import { AdminHeader } from "@/components/admin/AdminHeader";
import { Sidebar } from "@/components/admin/Sidebar";
import { OmniSearch } from "@/components/admin/OmniSearch";
import { verifySession } from "@/lib/auth-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0A0A0A] overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      <OmniSearch />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AdminHeader 
          userEmail={session.user?.email || session.user?.phone_number || "Unknown"} 
          userRole={session.role || "admin"} 
        />

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
