import { redirect } from "next/navigation";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { InstallerPipeline } from "@/components/installer/InstallerPipeline";
import type { Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function InstallerJobsPage() {
  const session = await verifyInstallerSession();
  if (!session.isAuthenticated) redirect("/installer/login");
  const installerId = session.installerId!;

  // Fetch all leads exclusively assigned to this installer
  const leadsSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .where("assigned_to_installer_id", "==", installerId)
    .orderBy("created_at", "desc")
    .limit(200)
    .get();

  const activeLeads: Lead[] = [];
  leadsSnap.docs.forEach((doc) => {
    activeLeads.push({ id: doc.id, ...doc.data() } as Lead);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          My Jobs
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          All leads and site visits exclusively assigned to you.
        </p>
      </div>

      <InstallerPipeline 
        leads={activeLeads} 
        partnerId={installerId}
        role="installer"
      />
    </div>
  );
}
