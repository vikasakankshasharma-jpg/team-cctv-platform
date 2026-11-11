import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import AdminLoginForm from "./LoginForm";
import LogoutSwitchButton from "./LogoutSwitchButton";
import { TranslatedText } from "@/components/shared/TranslatedText";
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 text-center bg-[var(--bg)] text-[var(--text)]">
        <h1 className="text-2xl font-bold mb-4 leading-snug">
          <TranslatedText tKey="adm_login_unauth_title" defaultText="Unauthorized" />
        </h1>
        <p className="mb-6 leading-relaxed max-w-md">
          <TranslatedText tKey="adm_login_unauth_desc" defaultText="Your account does not have permission to access the Command Centre." />
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="/" className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 leading-snug">
            <TranslatedText tKey="adm_login_home" defaultText="Return to Home" />
          </a>
          <LogoutSwitchButton />
        </div>
      </div>
    );
  }

  return <AdminLoginForm />;
}
