import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { Users } from "lucide-react";
import type { Lead } from "@/types";
import { LeadsClient } from "@/components/admin/LeadsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { TranslatedText } from "@/components/shared/TranslatedText";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Leads | Sales Portal",
};

export const dynamic = "force-dynamic";

export default async function SalespersonLeadsPage() {
  const session = await verifySession();
  
  if (!session.isAuthenticated || (session.role !== "sales_staff" && session.role !== "super_admin")) {
    redirect("/admin/login");
  }

  let leads: any[] = [];
  
  if (session.user) {
    // 1. Find the salesperson ID (resilient across salespeople / salespersons)
    const { findSalespersonByUid } = await import("@/lib/salesperson-utils");
    const spDoc = await findSalespersonByUid(session.user.uid);
      
    if (spDoc) {
      const spId = spDoc.id;
      
      // 2. Fetch leads assigned to this salesperson (resilient across both assigned_to_salesperson_id and assigned_salesperson_id)
      const assignedToPromise = adminDb.collection("leads")
        .where("assigned_to_salesperson_id", "==", spId)
        .orderBy("created_at", "desc")
        .limit(25)
        .get();

      const assignedPromise = adminDb.collection("leads")
        .where("assigned_salesperson_id", "==", spId)
        .orderBy("created_at", "desc")
        .limit(25)
        .get();

      const [assignedToSnap, assignedSnap] = await Promise.all([assignedToPromise, assignedPromise]);
      const mergedMap = new Map();
      assignedToSnap.docs.forEach(d => mergedMap.set(d.id, d));
      assignedSnap.docs.forEach(d => mergedMap.set(d.id, d));
        
      leads = Array.from(mergedMap.values()).map(doc => {
        const data = doc.data() as Lead;
        return {
          ...data,
          id: doc.id,
          created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
          updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
          site_visit_date: (data.site_visit_date as any)?.toDate?.()?.toISOString() || data.site_visit_date || null,
          sla_breach_at: (data.sla_breach_at as any)?.toDate?.()?.toISOString() || data.sla_breach_at || null,
        };
      });

      const nextCursor = leads.length === 20 ? leads[leads.length - 1].created_at : null;

      return (
        <div className="space-y-10 animate-in fade-in duration-700">
          <PageHeader
            icon={Users}
            title={<TranslatedText tKey="sls_nav_my_leads" defaultText="My Leads" />}
            description={<TranslatedText tKey="sls_leads_desc" defaultText="Leads assigned to you for processing." />}
            badge={<TranslatedText tKey="sls_total_badge" defaultText="{count} Total" params={{ count: String(leads.length) }} />}
          />
          
          <div className="pb-20">
            <LeadsClient 
              initialLeads={leads} 
              industrialLeads={[]} 
              isAdmin={false}
              salespersonId={spId}
              nextCursor={nextCursor}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={Users}
        title={<TranslatedText tKey="sls_nav_my_leads" defaultText="My Leads" />}
        description={<TranslatedText tKey="sls_leads_desc" defaultText="Leads assigned to you for processing." />}
        badge={<TranslatedText tKey="sls_total_badge" defaultText="{count} Total" params={{ count: "0" }} />}
      />
      <div className="pb-20">
        <LeadsClient 
          initialLeads={[]} 
          industrialLeads={[]} 
          isAdmin={false}
        />
      </div>
    </div>
  );
}
