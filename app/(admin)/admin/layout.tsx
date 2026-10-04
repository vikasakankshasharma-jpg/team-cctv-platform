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
  // Strictly check for an admin session to access admin portal
  const session = await verifySession("admin");
  
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "";

  if (currentPath === "/admin/login") {
    // If they are on the login page but ALREADY have an admin session, send them to dashboard
    if (session.isAuthenticated && ["super_admin", "admin", "sales_staff"].includes(session.role as string)) {
      redirect("/admin/dashboard");
    }
    return (
      <div className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
      </div>
    );
  }

  // If not authenticated with an ADMIN session, check if they have ANOTHER session to redirect them away
  if (!session.isAuthenticated) {
    const globalSession = await verifySession(); // Checks all cookies
    if (globalSession.isAuthenticated) {
      const r = globalSession.role as string;
      if (r === "customer") redirect("/customer/dashboard");
      if (r === "partner") redirect("/partner/dashboard");
      if (r === "installer") redirect("/installer/dashboard");
    }
    // If absolutely no session, force them to login
    redirect("/admin/login");
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
