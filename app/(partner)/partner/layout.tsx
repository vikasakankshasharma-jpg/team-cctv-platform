import { verifyPartnerSession } from "@/lib/auth-partner";
import { redirect } from "next/navigation";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyPartnerSession();
  
  if (!session.isAuthenticated) {
    // If not authenticated, the middleware should have redirected them, 
    // but just in case this is the login page (or middleware fails)
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <PartnerSidebar partnerName={session.promoterName || "Partner"} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 scrollbar-none">
          <div className="max-w-6xl mx-auto pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
