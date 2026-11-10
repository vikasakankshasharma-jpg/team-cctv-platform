import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { GeoPricingRule } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { GeoRulesClient } from "@/components/admin/GeoRulesClient";
import { PricingSubNav } from "@/components/admin/navigation/AdminSubNav";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geo-Pricing Rules | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function GeoRulesPage() {
  await requireAdmin();

  let rules: GeoPricingRule[] = [];
  try {
    const snapshot = await adminDb.collection("geo_pricing_rules").orderBy("priority", "asc").get();
    rules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GeoPricingRule[];
  } catch (err) {
    console.warn("⚠️ Failed to load geo_pricing_rules from Firestore, using defaults:", err);
    rules = [
      { id: "geo_1", level: "pincode", target_value: "302001", priority: 10, labor_multiplier: 1.0, flat_travel_fee: 0, is_active: true },
      { id: "geo_2", level: "pincode", target_value: "302015", priority: 15, labor_multiplier: 1.0, flat_travel_fee: 100, is_active: true },
      { id: "geo_3", level: "city", target_value: "Jaipur", priority: 50, labor_multiplier: 1.0, flat_travel_fee: 0, is_active: true },
      { id: "geo_4", level: "state", target_value: "Rajasthan", priority: 100, labor_multiplier: 1.1, flat_travel_fee: 250, is_active: true },
    ] as GeoPricingRule[];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PricingSubNav />
      <PageHeader
        title="Geo-Pricing Rules Engine"
        description="Manage the deterministic pricing matrix. Rules are evaluated in priority order: Surge > Pincode > City > State."
        icon={MapPin}
      />
      
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8">
        <GeoRulesClient data={rules} />
      </div>
    </div>
  );
}
