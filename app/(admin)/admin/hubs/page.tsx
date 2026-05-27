import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Hub } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { HubsClient } from "@/components/admin/HubsClient";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "City Hubs | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function HubsAdminPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("hubs").orderBy("created_at", "desc").get();
  
  const hubs: Hub[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Hub[];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title="City Hubs (Hardware & Inventory)"
        description="Manage micro-franchise hubs responsible for securely holding and dispatching hardware inventory."
        icon={Building2}
      />
      
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8">
        <HubsClient data={hubs} />
      </div>
    </div>
  );
}
