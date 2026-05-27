import { AdminHeader } from "@/components/admin/AdminHeader";
import { Sidebar } from "@/components/admin/Sidebar";
import { OmniSearch } from "@/components/admin/OmniSearch";
import { verifySession } from "@/lib/auth-server";

export const metadata = {
  manifest: "/manifest-admin.json",
  title: "Admin Portal | TEAM CCTV"
};

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
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20">
      <OmniSearch />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 -z-10 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
        
        <AdminHeader 
          userEmail={session.user?.email || session.user?.phone_number || "Unknown"} 
          userRole={session.role || "admin"} 
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative scrollbar-none">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
