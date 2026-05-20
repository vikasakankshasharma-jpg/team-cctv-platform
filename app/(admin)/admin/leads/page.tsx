import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
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
  const session = await verifySession();
  const isAdmin = session.isAuthenticated && session.role === "super_admin";
  const isSalesStaff = session.isAuthenticated && session.role === "sales_staff";

  // Guard: only admins and active sales staff can access CRM
  if (!isAdmin && !isSalesStaff) {
    redirect("/admin/login?redirect=/admin/leads");
  }
  let allowedPincodes: string[] = [];
  if (isSalesStaff && session.user) {
    const salespersonSnap = await adminDb.collection("salespeople")
      .where("firebase_uid", "==", session.user.uid)
      .where("is_active", "==", true)
      .limit(1)
      .get();
    
    if (!salespersonSnap.empty) {
      const spData = salespersonSnap.docs[0].data();
      const zoneIds = spData.assigned_zone_ids || [];
      if (zoneIds.length > 0) {
        const zonesSnap = await adminDb.collection("coverage_zones")
          .where("__name__", "in", zoneIds)
          .get();
        
        zonesSnap.docs.forEach(doc => {
          allowedPincodes = [...allowedPincodes, ...(doc.data().pincodes || [])];
        });
      }
    }
  }

  const PAGE_SIZE = 25;
  const lastDate = searchParams.lastDate ? new Date(searchParams.lastDate) : null;
  
  let query = adminDb.collection("leads")
    .orderBy("created_at", "desc");

  // Apply geo-filtering for sales staff
  if (isSalesStaff) {
    if (allowedPincodes.length > 0) {
      // Note: Firestore 'in' query limit is 30 items
      query = query.where("address.pincode", "in", allowedPincodes.slice(0, 30));
    } else {
      // No assigned pincodes = no leads
      query = query.where("address.pincode", "==", "NONE_ASSIGNED");
    }
  }

  query = query.limit(PAGE_SIZE);

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

  // Fetch salespeople for assignment dropdown
  let salespeople: { id: string; name: string }[] = [];
  if (isAdmin) {
    const spSnap = await adminDb.collection("salespeople").where("is_active", "==", true).get();
    salespeople = spSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
  }

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
          salespeople={salespeople}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
