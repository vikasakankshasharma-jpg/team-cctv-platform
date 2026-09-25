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
    .where("status", "in", ["new", "contacted", "site_visit", "negotiation", "quoted", "booked", "won", "in_progress"])
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const activeLeads: Lead[] = [];
  leadsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const assignedId = data.assigned_to_installer_id || data.assigned_installer_id;
    // Include if assigned to this installer OR broadcasted to this installer
    if (
      assignedId === installerId ||
      (data.broadcasted_to_installer_ids && data.broadcasted_to_installer_ids.includes(installerId))
    ) {
      activeLeads.push({ 
        id: doc.id, 
        ...data,
        assigned_installer_id: assignedId,
        assigned_to_installer_id: assignedId
      } as unknown as Lead);
    }
  });

  // 3. Fetch Active Installation Jobs assigned to this installer
  const jobsSnap = await adminDb
    .collection("jobs")
    .where("installer_id", "==", installerId)
    .where("status", "in", ["PENDING_DISPATCH", "assigned", "en_route", "in_progress", "pending_customer_approval"])
    .get();

  jobsSnap.docs.forEach((doc) => {
    const j = doc.data();
    activeLeads.push({
      id: doc.id,
      customer_name: j.customer?.name || "Installation Job",
      customer_mobile: j.customer?.mobile || "",
      address: {
        pincode: j.address?.pincode,
        city: j.address?.city,
        full_address: j.address?.full_address,
      },
      status: "in_progress",
      assigned_installer_id: installerId,
      assigned_to_installer_id: installerId,
      created_at: j.created_at || new Date().toISOString(),
      job_status: j.status,
    } as unknown as Lead);
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
