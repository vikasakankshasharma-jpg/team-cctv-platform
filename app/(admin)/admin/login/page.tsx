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

  // If already authenticated, do not show the login page
  if (session.isAuthenticated) {
    redirect("/admin/leads");
  }

  return <AdminLoginForm />;
}
