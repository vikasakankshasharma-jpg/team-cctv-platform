import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/admin/PageHeader";
import { MapPin } from "lucide-react";
import ExpansionClient from "@/components/admin/ExpansionClient";
import { getGeoHierarchyData } from "@/lib/geo/geoHierarchyServer";
import { resolveStaticHierarchy } from "@/lib/geo/geoHierarchy";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Regional Expansion Hub | Command Centre",
  description: "Monitor and manage unserved territory waitlists, prospect density, and regional growth.",
};

export default async function AdminExpansionPage() {
  await requireAdmin();

  // 1. Fetch live 4-tier Geo Hierarchy Tree & aggregates
  const { tree, summary } = await getGeoHierarchyData();

  // 2. Fetch waitlisted leads and enrich with hierarchy metadata
  const snapshot = await adminDb
    .collection("leads")
    .where("service_status", "==", "waitlist")
    .get();

  const leads = snapshot.docs.map((doc) => {
    const data = doc.data();
    const pin = data.detected_pincode || "";
    const meta = pin ? resolveStaticHierarchy(pin) : null;

    return {
      id: doc.id,
      customer_name: data.customer_name || "Anonymous",
      mobile_number: data.mobile_number || "N/A",
      detected_pincode: pin || "N/A",
      detected_tehsil: data.detected_tehsil || meta?.tehsil || "General",
      detected_city: data.detected_district || data.detected_city || meta?.district || "Unknown",
      detected_district: data.detected_district || data.detected_city || meta?.district || "Unknown",
      detected_state: data.detected_state || meta?.state || "Rajasthan",
      detected_city_slug: data.detected_city_slug || "",
      waitlist_confirmed: data.waitlist_confirmed || false,
      created_at: data.created_at?.toDate?.()?.toISOString() || null,
    };
  }).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // 3. Fetch service area metadata (aggregates)
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

  // 4. Fetch impressions
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
        description="Administrative 4-Tier Geo Hierarchy (State → District → Tehsil → PINCODE) with Active/Inactive switches and waitlist CRM."
        badge={`${summary.active_pincodes} Active / ${summary.inactive_pincodes} Inactive PINs`}
      />

      <ExpansionClient 
        initialLeads={leads} 
        initialTree={tree}
        initialSummary={summary}
        initialServiceAreas={serviceAreas} 
        initialImpressions={impressions} 
      />
    </div>
  );
}
