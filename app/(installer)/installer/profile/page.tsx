import { redirect } from "next/navigation";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { InstallerProfileClient } from "@/components/installer/InstallerProfileClient";
import type { Installer } from "@/types";

export const dynamic = "force-dynamic";

export default async function InstallerProfilePage() {
  const session = await verifyInstallerSession();
  if (!session.isAuthenticated) redirect("/installer/login");
  const installerId = session.installerId!;

  const docSnap = await adminDb.collection(COLLECTIONS.INSTALLERS).doc(installerId).get();
  
  if (!docSnap.exists) {
    return <div>Profile not found.</div>;
  }

  const data = docSnap.data() as Installer;
  
  const profile = {
    id: docSnap.id,
    name: data.name || "",
    mobile_number: data.mobile_number || "",
    email: data.email || "",
    kyc_status: data.kyc_status || "pending",
    is_active: data.is_active || false,
    sla_score: data.sla_score || 0,
    avg_rating: data.avg_rating || 0,
    jobs_completed: data.jobs_completed || 0,
    wallet_balance: data.wallet_balance || 0,
    bank_account: data.bank_account || "",
    bank_ifsc: data.bank_ifsc || "",
    bank_account_verified: data.bank_account_verified || false,
    skills: data.skills || [],
    serviceable_pincodes: data.serviceable_pincodes || [],
  };

  return <InstallerProfileClient initialProfile={profile} />;
}
