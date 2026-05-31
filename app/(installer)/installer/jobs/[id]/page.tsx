import { verifySession } from "@/lib/auth-server";
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
  const session = await verifySession();

  if (!session.isAuthenticated || session.role !== "installer") {
    redirect("/installer/login");
  }

  // Fetch lead to verify assignment
  const leadDoc = await adminDb.collection("leads").doc(params.id).get();
  if (!leadDoc.exists) {
    redirect("/installer/jobs");
  }

  const lead = leadDoc.data();
  // Ensure the installer is authorized to view this job
  const isAssigned = lead?.assigned_installer_id === session.user?.uid;
  const isBroadcasted = lead?.broadcasted_to_installer_ids?.includes(session.user?.uid);

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
      />
    </div>
  );
}
