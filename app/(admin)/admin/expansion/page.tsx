import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/admin/PageHeader";
import { MapPin } from "lucide-react";
import ExpansionClient from "@/components/admin/ExpansionClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Regional Expansion Hub | Command Centre",
  description: "Monitor and manage unserved territory waitlists, prospect density, and regional growth.",
};

export default async function AdminExpansionPage() {
  await requireAdmin();

  // 1. Fetch waitlisted leads
  const snapshot = await adminDb
    .collection("leads")
    .where("service_status", "==", "waitlist")
    .get();

  const leads = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      customer_name: data.customer_name || "Anonymous",
      mobile_number: data.mobile_number || "N/A",
      detected_pincode: data.detected_pincode || "N/A",
      detected_city: data.detected_city || "Unknown",
      detected_city_slug: data.detected_city_slug || "",
      waitlist_confirmed: data.waitlist_confirmed || false,
      created_at: data.created_at?.toDate?.()?.toISOString() || null,
    };
  }).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // 2. Fetch service area metadata (aggregates)
  const serviceAreasSnap = await adminDb.collection("service_areas").get();
  const serviceAreas = serviceAreasSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      city: data.city || doc.id,
      waitlist_count: data.waitlist_count || 0,
      served: data.served || false,
    };
  });

  // 3. Fetch impressions
  const impressionsSnap = await adminDb.collection("demand_impressions").get();
  const impressions = impressionsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      city: data.city || "",
      pincode: data.pincode || ""
    };
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        icon={MapPin} 
        title="Regional Expansion Hub" 
        description="Analyze waitlist metrics across unserved territories and orchestrate installer hub launch campaigns."
        badge={`${leads.length} Prospects Enrolled`}
      />

      <ExpansionClient initialLeads={leads} initialServiceAreas={serviceAreas} initialImpressions={impressions} />
    </div>
  );
}
