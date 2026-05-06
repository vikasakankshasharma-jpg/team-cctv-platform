import { requireAdmin } from "@/lib/auth-server";
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
  await requireAdmin();

  const PAGE_SIZE = 25;
  const lastDate = searchParams.lastDate ? new Date(searchParams.lastDate) : null;
  
  let query = adminDb.collection("leads")
    .orderBy("created_at", "desc")
    .limit(PAGE_SIZE);

  if (lastDate) {
    query = query.startAfter(lastDate);
  }

  const snapshot = await query.get();

  // Fetch industrial leads
  const indSnapshot = await adminDb.collection("industrial_leads")
    .orderBy("created_at", "desc")
    .limit(50)
    .get();

  const industrialLeads = indSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      status: data.status || "new",
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
    };
  }) as any[];

  // Fetch all active promoters to join data
  const promotersSnapshot = await adminDb.collection("promoters").get();
  const promoterMap: Record<string, { name: string, business_name?: string }> = {};
  promotersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    promoterMap[doc.id] = { name: data.name, business_name: data.business_name };
  });

  const leads = snapshot.docs.map(doc => {
    const data = doc.data() as Lead;
    const promoter = data.promoter_id ? promoterMap[data.promoter_id] : null;
    
    return {
      ...data,
      id: doc.id,
      promoter_name: promoter?.name || null,
      promoter_business: promoter?.business_name || null,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
      updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
      site_visit_date: (data.site_visit_date as any)?.toDate?.()?.toISOString() || data.site_visit_date || null
    };
  });

  const nextCursor = snapshot.docs.length === PAGE_SIZE 
    ? snapshot.docs[snapshot.docs.length - 1].data().created_at?.toDate?.()?.toISOString() 
    : null;

  const newCount = leads.filter(l => l.status === "new").length + industrialLeads.filter(l => l.status === "new").length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={Users}
        title="Leads CRM"
        description="Monitor and orchestrate OTP-verified customer acquisitions through the Catalyst pipeline."
        badge={`${leads.length + industrialLeads.length} Total Spectrum · ${newCount} Hot Nodes`}
      />
      
      <div className="pb-20">
        <LeadsClient 
          initialLeads={leads} 
          industrialLeads={industrialLeads as any[]} 
          nextCursor={nextCursor} 
        />
      </div>
    </div>
  );
}
