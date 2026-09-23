import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Megaphone } from "lucide-react";
import { COLLECTIONS } from "@/lib/constants";
import MarketingQRClient from "@/components/admin/MarketingQRClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketing QR Codes | Admin Command Centre",
  description: "Generate and manage offline marketing campaigns and QR codes.",
};

export default async function MarketingQRAdminPage() {
  await requireAdmin();

  let campaigns = [];
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.MARKETING_CAMPAIGNS)
      .orderBy("created_at", "desc")
      .get();

    campaigns = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
      };
    }) as any[];
  } catch (err) {
    console.error("[MarketingQRAdminPage] Failed to fetch data:", err);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Marketing QR Codes"
        description="Create trackable WhatsApp QR codes for offline marketing (Flyers, Newspapers, Posters)."
        badge={`${campaigns.filter(c => c.is_active).length} Active Campaigns`}
      />
      
      <MarketingQRClient initialCampaigns={campaigns} />
    </div>
  );
}
