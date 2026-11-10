import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { FollowUpCampaign } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { GrowthSubNav } from "@/components/admin/navigation/AdminSubNav";
import { Megaphone } from "lucide-react";
import CampaignsClient from "@/components/admin/CampaignsClient";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requireAdmin();

  let campaigns: FollowUpCampaign[] = [];
  try {
    const snapshot = await adminDb
      .collection("followup_campaigns")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
      };
    }) as FollowUpCampaign[];
  } catch (err) {
    console.warn("⚠️ Failed to load campaigns from Firestore:", err);
  }

  return (
    <div className="space-y-6">
      <GrowthSubNav />
      <PageHeader 
        icon={Megaphone} 
        title="Smart Follow-Up Engine" 
        description="Configure automated abandoned-cart sequences and dynamic discounts."
        badge={`${campaigns.filter(c => c.is_active).length} Active Campaigns`}
      />

      <CampaignsClient initialCampaigns={campaigns} />
    </div>
  );
}
