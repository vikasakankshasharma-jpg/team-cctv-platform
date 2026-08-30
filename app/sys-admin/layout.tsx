import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    redirect("/login");
  }

  if (session.role !== "super_admin" && session.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-900">System Admin Console</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
              {session.role}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
