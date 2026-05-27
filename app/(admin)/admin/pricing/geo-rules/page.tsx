import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { GeoPricingRule } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { GeoRulesClient } from "@/components/admin/GeoRulesClient";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geo-Pricing Rules | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function GeoRulesPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("geo_pricing_rules").orderBy("priority", "asc").get();
  
  const rules: GeoPricingRule[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GeoPricingRule[];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
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
