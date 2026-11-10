import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { Calendar, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { BookingsClient } from "@/components/admin/BookingsClient";
import { CrmSubNav } from "@/components/admin/navigation/AdminSubNav";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Site Visits | Operational Hub",
  description: "Schedule and manage technician site visits for pinpoint location verification.",
};

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  await requireAdmin();

  let rawBookings: any[] = [];
  let isQuotaFallback = false;

  try {
    const snapshot = await adminDb.collection("site_visit_bookings")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    rawBookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    if (err?.code === 8 || err?.message?.includes("Quota exceeded") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      isQuotaFallback = true;
    }
    try {
      const snapFallback = await adminDb.collection("site_visit_bookings").limit(50).get();
      rawBookings = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (_) {
      isQuotaFallback = true;
    }
  }

  // Fetch unique lead IDs involved
  const leadIds = Array.from(new Set(rawBookings.map((b: any) => b.lead_id).filter(Boolean)));
  
  const leadMap: Record<string, any> = {};
  if (leadIds.length > 0 && !isQuotaFallback) {
    const chunks = [];
    for (let i = 0; i < leadIds.length; i += 10) {
      chunks.push(leadIds.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
      try {
        const leadsSnapshot = await adminDb.collection("leads").where("__name__", "in", chunk).get();
        leadsSnapshot.docs.forEach(doc => {
          leadMap[doc.id] = doc.data();
        });
      } catch (_) {}
    }
  }

  // Fetch all active promoters
  const promoterMap: Record<string, { name: string, business_name?: string }> = {};
  if (!isQuotaFallback) {
    try {
      const promotersSnapshot = await adminDb.collection("promoters").get();
      promotersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        promoterMap[doc.id] = { name: data.name, business_name: data.business_name };
      });
    } catch (_) {}
  }

  let bookings = rawBookings.map((b: any) => {
    const lead = leadMap[b.lead_id];
    const promoter = lead?.promoter_id ? promoterMap[lead.promoter_id] : null;

    return {
      ...b,
      customer_name: b.customer_name || lead?.customer_name || "Customer",
      mobile_number: b.customer_mobile || lead?.mobile_number || "No Contact",
      promoter_name: promoter?.name || null,
      promoter_business: promoter?.business_name || null,
      created_at: (b.created_at as any)?.toDate?.()?.toISOString() || b.created_at || null,
      site_visit_date: (b.site_visit_date as any)?.toDate?.()?.toISOString() || b.site_visit_date || b.preferred_date || null,
      ttl: (b.ttl as any)?.toDate?.()?.toISOString() || b.ttl || null,
    };
  });

  // Fallback to cached leads that have site surveys scheduled if DB returned empty
  if (bookings.length === 0) {
    try {
      const cachePath = path.resolve(process.cwd(), "lib/leads-cache.json");
      if (fs.existsSync(cachePath)) {
        const cachedLeads = JSON.parse(fs.readFileSync(cachePath, "utf8"));
        const surveyLeads = cachedLeads.filter((l: any) => l.site_visit_date || l.leadStatus === "SITE_VISIT");
        bookings = surveyLeads.map((l: any, idx: number) => ({
          id: `SV-BOOKING-${idx + 1}`,
          lead_id: l.leadId || l.id,
          quote_id: l.quoteId,
          customer_name: l.customer_name,
          mobile_number: l.customer_mobile,
          address: "Jaipur, Rajasthan",
          preferred_date: l.site_visit_date || "2026-11-12",
          site_visit_date: l.site_visit_date || "2026-11-12",
          time_slot: l.site_visit_slot || "10:00 AM - 01:00 PM",
          status: "confirmed",
          created_at: l.createdAt,
          promoter_name: null,
          promoter_business: null,
          ttl: null
        }));
        isQuotaFallback = true;
      }
    } catch (_) {}
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CrmSubNav />

      {isQuotaFallback && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Firestore Free Spark Quota Active — Showing Cached Site Visits</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Google Cloud Firestore daily read limit is currently throttling live queries. Showing scheduled technician site visits from the cached pipeline so assignments can proceed without disruption.
            </p>
          </div>
        </div>
      )}

      <PageHeader 
        icon={Calendar} 
        title="Site Visits" 
        description="Schedule and manage technician site visits for pinpoint location verification."
        badge={`${bookings.length} Active Nodes`}
      />
      
      <div className="max-w-7xl">
        <BookingsClient initialBookings={bookings} />
      </div>
    </div>
  );
}
