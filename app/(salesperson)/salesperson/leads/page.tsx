import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { Users } from "lucide-react";
import type { Lead } from "@/types";
import { LeadsClient } from "@/components/admin/LeadsClient";
import { PageHeader } from "@/components/admin/PageHeader";
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
    // 1. Find the salesperson ID
    const spSnap = await adminDb.collection("salespeople")
      .where("firebase_uid", "==", session.user.uid)
      .limit(1)
      .get();
      
    if (!spSnap.empty) {
      const spId = spSnap.docs[0].id;
      
      // 2. Fetch leads assigned to this salesperson
      const leadsSnap = await adminDb.collection("leads")
        .where("assigned_to_salesperson_id", "==", spId)
        .orderBy("created_at", "desc")
        .limit(50)
        .get();
        
      leads = leadsSnap.docs.map(doc => {
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
    }
  }

  const newCount = leads.filter(l => l.status === "new").length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={Users}
        title="My Leads"
        description="Leads assigned to you for processing."
        badge={`${leads.length} Total · ${newCount} New`}
      />
      
      <div className="pb-20">
        {/* We pass isAdmin=false so the assignment dropdown is hidden from sales staff */}
        <LeadsClient 
          initialLeads={leads} 
          industrialLeads={[]} 
          isAdmin={false}
        />
      </div>
    </div>
  );
}
