import { AdminHeader } from "@/components/admin/AdminHeader";
import { Sidebar } from "@/components/admin/Sidebar";
import { OmniSearch } from "@/components/admin/OmniSearch";
import { verifySession } from "@/lib/auth-server";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = {
  manifest: "/manifest-admin.json",
  title: "Admin Portal | CCTVQuotation"
};

const adminThemeVars: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  color: 'var(--text)',
} as React.CSSProperties;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "";

  if (!session.isAuthenticated || !["super_admin", "admin", "sales_staff"].includes(session.role as string)) {
    if (currentPath === "/admin/login") {
      return (
        <div 
          className={`admin-theme ${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-[var(--bg)] font-sans text-[var(--text)]`}
          style={adminThemeVars}
        >
          {children}
        </div>
      );
    } else {
      redirect("/admin/login");
    }
  }

  return (
    <div className={`admin-theme ${spaceGrotesk.variable} ${jetbrainsMono.variable} flex h-screen overflow-hidden font-sans bg-[var(--bg)] text-[var(--text)]`}
      style={adminThemeVars}
    >
      <OmniSearch />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="hidden md:block">
          <AdminHeader 
            userEmail={session.user?.email || session.user?.phone_number || "Unknown"} 
            userRole={session.role || "admin"} 
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 pt-18 md:pt-4 lg:pt-6 relative scrollbar-none bg-[var(--bg)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
