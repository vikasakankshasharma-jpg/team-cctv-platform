import { verifyInstallerSession } from "@/lib/auth-installer";
import { InstallerSidebar } from "@/components/installer/InstallerSidebar";

export default async function InstallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyInstallerSession();
  
  if (!session.isAuthenticated) {
    // If not authenticated, the middleware should have redirected them, 
    // but just in case this is the login page (or middleware fails)
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <InstallerSidebar installerName={session.installerName || "Installer"} />
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
