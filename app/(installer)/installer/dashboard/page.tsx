import { redirect } from "next/navigation";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { InstallerDashboardClient } from "@/components/installer/InstallerDashboardClient";
import type { Lead, Installer } from "@/types";

export const dynamic = "force-dynamic";

export default async function InstallerDashboardPage() {
  const session = await verifyInstallerSession();
  if (!session.isAuthenticated) redirect("/installer/login");
  const installerId = session.installerId!;

  // 1. Fetch Installer Stats (Wallet & SLA)
  const installerDoc = await adminDb.collection(COLLECTIONS.INSTALLERS).doc(installerId).get();
  const installerData = installerDoc.data() as Installer;

  // 2. Fetch Active Leads (Assigned or Broadcasted to this installer)
  const leadsSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .where("status", "in", ["new", "contacted", "site_visit", "negotiation", "quoted"])
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const activeLeads: Lead[] = [];
  leadsSnap.docs.forEach((doc) => {
    const data = doc.data();
    // Include if assigned to this installer OR broadcasted to this installer
    if (
      data.assigned_to_installer_id === installerId ||
      (data.broadcasted_to_installer_ids && data.broadcasted_to_installer_ids.includes(installerId))
    ) {
      activeLeads.push({ id: doc.id, ...data } as Lead);
    }
  });

  return (
    <InstallerDashboardClient
      installerId={installerId}
      installerName={session.installerName || "Installer"}
      walletBalance={installerData?.wallet_balance || 0}
      slaScore={installerData?.sla_score || 100}
      jobsCompleted={installerData?.jobs_completed || 0}
      activeLeads={activeLeads}
    />
  );
}
