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
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 shadow-md sticky top-0 z-10 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-400">Field Operations</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
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
