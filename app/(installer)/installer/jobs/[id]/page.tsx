import { verifyInstallerSession } from "@/lib/auth-installer";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Wrench } from "lucide-react";
import type { Metadata } from "next";
import InstallerJobDetailClient from "@/components/installer/InstallerJobDetailClient";
import { adminDb } from "@/lib/firebase-admin";

export const metadata: Metadata = {
  title: "Job Details | Installer Portal",
};

export const dynamic = "force-dynamic";

export default async function InstallerJobDetailPage({ params }: { params: { id: string } }) {
  const session = await verifyInstallerSession();

  if (!session.isAuthenticated) {
    redirect("/installer/login");
  }

  const installerId = session.installerId!;

  // Fetch lead to verify assignment
  const leadDoc = await adminDb.collection("leads").doc(params.id).get();
  if (!leadDoc.exists) {
    redirect("/installer/jobs");
  }

  const lead = leadDoc.data();
  // Ensure the installer is authorized to view this job
  const isAssigned = lead?.assigned_to_installer_id === installerId;
  const isBroadcasted = lead?.broadcasted_to_installer_ids?.includes(installerId);

  if (!isAssigned && !isBroadcasted) {
    redirect("/installer/jobs");
  }

  // Get the latest quote to show hardware requirements
  let hardware: any[] = [];
  if (lead?.last_quote_id) {
     const quoteDoc = await adminDb.collection("leads").doc(params.id).collection("quotes").doc(lead.last_quote_id).get();
     if (quoteDoc.exists) {
        hardware = quoteDoc.data()?.configuration_snapshot || [];
     }
  }

  // Fetch Job details
  let job: any = null;
  let hub: any = null;
  const jobsSnap = await adminDb.collection("jobs").where("lead_id", "==", params.id).limit(1).get();
  if (!jobsSnap.empty) {
    job = { id: jobsSnap.docs[0].id, ...jobsSnap.docs[0].data() };
    if (job.hub_id) {
      const hubDoc = await adminDb.collection("hubs").doc(job.hub_id).get();
      if (hubDoc.exists) {
        hub = { id: hubDoc.id, ...hubDoc.data() };
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        icon={Wrench}
        title="Job Details"
        description="View dispatch notes, hardware requirements, and upload proof of installation."
      />
      
      <InstallerJobDetailClient 
        leadId={params.id} 
        lead={JSON.parse(JSON.stringify(lead))} 
        hardware={JSON.parse(JSON.stringify(hardware))}
        isAssigned={isAssigned}
        job={job ? JSON.parse(JSON.stringify(job)) : null}
        hub={hub ? JSON.parse(JSON.stringify(hub)) : null}
      />
    </div>
  );
}
