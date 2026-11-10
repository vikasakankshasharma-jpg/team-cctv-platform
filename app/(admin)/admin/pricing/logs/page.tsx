import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { History } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { PricingSubNav } from "@/components/admin/navigation/AdminSubNav";
import { AuditLogClient } from "@/components/admin/AuditLogClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Price Audit Log | Compliance Hub",
  description: "Review historical price adjustments and administrative overhead changes.",
};

export const dynamic = "force-dynamic";

export default async function PriceLogsPage() {
  await requireAdmin();

  let logs: any[] = [];
  try {
    const snapshot = await adminDb.collection("price_change_log")
      .orderBy("created_at", "desc")
      .limit(100)
      .get();

    logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
      };
    });
  } catch (err) {
    console.warn("⚠️ Failed to load price change logs from Firestore:", err);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <PricingSubNav />
      <PageHeader
        icon={History}
        title="Price Audit Log"
        description="Chronological ledger of product pricing adjustments and overhead modifications."
        badge={`${logs.length} Recorded Shifts`}
      />
      
      <div className="pb-10 md:pb-20">
        <AuditLogClient initialLogs={logs as any[]} />
      </div>
    </div>
  );
}
