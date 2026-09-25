import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerProfileClient } from "@/components/customer/CustomerProfileClient";

export const metadata: Metadata = {
  title: "My Profile | TEAM CCTV",
  description: "Manage your personal information and preferences.",
};

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage() {
  const session = await verifySession();

  if (!session.isAuthenticated) {
    redirect("/customer/login?redirect=/customer/profile");
  }

  const uid = session.user?.uid || session.uid || "";
  let phoneNumber = session.user?.phone_number;
  let name = session.user?.name || "";
  let email = session.user?.email || "";

  if (uid) {
    try {
      const userRecord = await adminAuth.getUser(uid);
      phoneNumber = userRecord.phoneNumber || phoneNumber;
      name = userRecord.displayName || name;
      email = userRecord.email || email;
    } catch (e) {
      console.warn("[CustomerProfile] Could not fetch user record:", e);
    }
  }

  const rawMobile = phoneNumber ? String(phoneNumber).replace(/\D/g, "").slice(-10) : "";

  const user = {
    uid,
    mobile: rawMobile,
    name,
    email
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link 
          href="/customer/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <CustomerProfileClient user={user} />
      </div>
    </div>
  );
}
