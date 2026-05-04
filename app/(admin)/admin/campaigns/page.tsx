import { adminDb } from "@/lib/firebase-admin";
import type { FollowUpCampaign } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Megaphone } from "lucide-react";
import CampaignsClient from "@/components/admin/CampaignsClient";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  // Fetch all campaigns, sorted by creation date
  const snapshot = await adminDb
    .collection("followup_campaigns")
    .orderBy("created_at", "desc")
    .get();

  const campaigns = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || null,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
    };
  }) as FollowUpCampaign[];

  return (
    <div className="space-y-6">
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
