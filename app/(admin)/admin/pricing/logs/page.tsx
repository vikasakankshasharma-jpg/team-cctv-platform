import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { History } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { AuditLogClient } from "@/components/admin/AuditLogClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Price Audit Log | Compliance Hub",
  description: "Review historical price adjustments and administrative overhead changes.",
};

export const dynamic = "force-dynamic";

export default async function PriceLogsPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("price_change_log")
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const logs = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
    };
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={History}
        title="Price Audit Log"
        description="Chronological ledger of product pricing adjustments and overhead modifications."
        badge={`${logs.length} Recorded Shifts`}
      />
      
      <div className="pb-20">
        <AuditLogClient initialLogs={logs as any[]} />
      </div>
    </div>
  );
}
