import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import AdminLoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Login | Command Centre",
  description: "Authorized personnel login",
};

export default async function AdminLoginPage() {
  const session = await verifySession();

  // If already authenticated and authorized, do not show the login page
  if (session.isAuthenticated && ["super_admin", "admin", "sales_staff"].includes(session.role as string)) {
    redirect("/admin/leads");
  } else if (session.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[var(--bg)] text-[var(--text)]">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p className="mb-6">Your account does not have permission to access the Command Centre.</p>
        <a href="/" className="px-6 py-3 bg-[var(--gold)] text-[#0A0E1A] font-bold rounded-xl">Return to Home</a>
      </div>
    );
  }

  return <AdminLoginForm />;
}
