import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { BookingsClient } from "@/components/admin/BookingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site Visits | Operational Hub",
  description: "Schedule and manage technician site visits for pinpoint location verification.",
};

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("site_visit_bookings")
    .orderBy("created_at", "desc")
    .limit(50)
    .get();

  const rawBookings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Fetch unique lead IDs involved
  const leadIds = Array.from(new Set(rawBookings.map((b: any) => b.lead_id).filter(Boolean)));
  
  // Fetch leads in batches of 10 (Firestore limit for 'in' query)
  const leadMap: Record<string, any> = {};
  if (leadIds.length > 0) {
    const chunks = [];
    for (let i = 0; i < leadIds.length; i += 10) {
      chunks.push(leadIds.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
      const leadsSnapshot = await adminDb.collection("leads").where("__name__", "in", chunk).get();
      leadsSnapshot.docs.forEach(doc => {
        leadMap[doc.id] = doc.data();
      });
    }
  }

  // Fetch all active promoters
  const promotersSnapshot = await adminDb.collection("promoters").get();
  const promoterMap: Record<string, { name: string, business_name?: string }> = {};
  promotersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    promoterMap[doc.id] = { name: data.name, business_name: data.business_name };
  });

  const bookings = rawBookings.map((b: any) => {
    const lead = leadMap[b.lead_id];
    const promoter = lead?.promoter_id ? promoterMap[lead.promoter_id] : null;

    return {
      ...b,
      customer_name: lead?.customer_name || "Unknown",
      mobile_number: lead?.mobile_number || "No Contact",
      promoter_name: promoter?.name || null,
      promoter_business: promoter?.business_name || null,
      created_at: (b.created_at as any)?.toDate?.()?.toISOString() || b.created_at || null,
      site_visit_date: (b.site_visit_date as any)?.toDate?.()?.toISOString() || b.site_visit_date || null,
    };
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        icon={Calendar} 
        title="Site Visits" 
        description="Schedule and manage technician site visits for pinpoint location verification."
        badge={`${bookings.length} Active Nodes`}
      />
      
      <BookingsClient initialBookings={bookings as any[]} />
    </div>
  );
}
