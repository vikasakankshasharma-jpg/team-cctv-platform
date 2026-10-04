import { verifyPartnerSession } from "@/lib/auth-partner";
import { redirect } from "next/navigation";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";

import { headers } from "next/headers";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "";
  
  const session = await verifyPartnerSession();

  // Allow the login page to render without authentication
  if (currentPath === "/partner/login") {
    if (session && session.isAuthenticated) {
      redirect("/partner/dashboard");
    }
    return <>{children}</>;
  }
  
  if (!session || !session.isAuthenticated) {
    // Cross-portal redirection check
    const { verifySession } = await import("@/lib/auth-server");
    const globalSession = await verifySession();
    if (globalSession.isAuthenticated) {
      const r = globalSession.role as string;
      if (r === "customer") redirect("/customer/dashboard");
      if (["super_admin", "admin", "sales_staff"].includes(r)) redirect("/admin/dashboard");
      if (r === "installer") redirect("/installer/dashboard");
    }
    redirect('/partner/login');
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <PartnerSidebar partnerName={session.promoterName || "Partner"} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 pt-18 md:pt-4 lg:pt-10 scrollbar-none">
          <div className="max-w-6xl mx-auto pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
