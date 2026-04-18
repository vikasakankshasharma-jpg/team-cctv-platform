import { adminDb } from "@/lib/firebase-admin";
import { Users } from "lucide-react";
import type { Lead } from "@/types";
import { LeadsClient } from "@/components/admin/LeadsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leads CRM | Intelligence Hub",
  description: "Monitor and orchestrate OTP-verified customer acquisitions through the Catalyst pipeline.",
};

export const dynamic = "force-dynamic";

export default async function LeadsAdminPage() {
  const snapshot = await adminDb.collection("leads")
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const leads = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Lead, "id">)
  })) as Lead[];

  const newCount = leads.filter(l => l.status === "new").length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={Users}
        title="Leads CRM"
        description="Monitor and orchestrate OTP-verified customer acquisitions through the Catalyst pipeline."
        badge={`${leads.length} Total Spectrum · ${newCount} Hot Nodes`}
      />
      
      <div className="pb-20">
        <LeadsClient initialLeads={leads} />
      </div>
    </div>
  );
}
