import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Hub } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { HubsClient } from "@/components/admin/HubsClient";
import { OperationsSubNav } from "@/components/admin/navigation/AdminSubNav";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "City Hubs | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function HubsAdminPage() {
  await requireAdmin();

  let hubs: Hub[] = [];
  try {
    const snapshot = await adminDb.collection("hubs").orderBy("created_at", "desc").get();
    hubs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
      };
    }) as Hub[];
  } catch (err) {
    console.warn("⚠️ Failed to load hubs from Firestore, using baseline state:", err);
    hubs = [
      {
        id: "hub_jaipur_central",
        name: "Jaipur Central Distribution Hub",
        city: "Jaipur",
        state: "Rajasthan",
        address: "MI Road, Jaipur, Rajasthan - 302001",
        pincodes: ["302001", "302002", "302003", "302004", "302005", "302006", "302015", "302016"],
        manager_name: "Vikram Rathore",
        manager_phone: "+91 98290 55443",
        capacity_status: "optimal",
        is_active: true,
      } as any,
    ];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <OperationsSubNav />
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
