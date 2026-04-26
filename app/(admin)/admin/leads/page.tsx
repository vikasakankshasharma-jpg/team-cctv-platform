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

export default async function LeadsAdminPage({
  searchParams,
}: {
  searchParams: { page?: string; lastId?: string; lastDate?: string };
}) {
  const PAGE_SIZE = 25;
  const lastDate = searchParams.lastDate ? new Date(searchParams.lastDate) : null;
  
  let query = adminDb.collection("leads")
    .orderBy("created_at", "desc")
    .limit(PAGE_SIZE);

  if (lastDate) {
    query = query.startAfter(lastDate);
  }

  const snapshot = await query.get();

  const leads = snapshot.docs.map(doc => {
    const data = doc.data() as Lead;
    return {
      ...data,
      id: doc.id,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
      updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
      site_visit_date: (data.site_visit_date as any)?.toDate?.()?.toISOString() || data.site_visit_date || null
    };
  });

  const nextCursor = snapshot.docs.length === PAGE_SIZE 
    ? snapshot.docs[snapshot.docs.length - 1].data().created_at?.toDate?.()?.toISOString() 
    : null;

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
        <LeadsClient initialLeads={leads} nextCursor={nextCursor} />
      </div>
    </div>
  );
}
