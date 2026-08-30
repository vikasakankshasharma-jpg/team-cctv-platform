import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    redirect("/login");
  }

  if (session.role !== "sales_staff" && session.role !== "super_admin") {
    // Unauthorized users (like customers or installers) should not see this layout
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">SecureEasy Sales CRM</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Role: {session.role}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
