import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FileBox } from "lucide-react";
import type { CommissionRecord, Promoter } from "@/types";
import { CommissionLedgerClient } from "@/components/admin/CommissionLedgerClient";
import { COLLECTIONS } from "@/lib/firebase-client";

export const dynamic = "force-dynamic";

export default async function CommissionAdminPage() {
  await requireAdmin();

  // Fetch commission records
  const snapshot = await adminDb.collection(COLLECTIONS.COMMISSION_RECORDS)
    .orderBy("created_at", "desc")
    .limit(200)
    .get();
  
  const commissions = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() ?? data.created_at ?? null,
      updated_at: data.updated_at?.toDate?.()?.toISOString() ?? data.updated_at ?? null,
    };
  }) as any[];

  // Fetch all promoters to build a name map
  const promotersSnapshot = await adminDb.collection(COLLECTIONS.PROMOTERS).get();
  const nameMap: Record<string, { name: string, role: string }> = {};
  promotersSnapshot.docs.forEach(doc => {
    const data = doc.data() as Promoter;
    nameMap[doc.id] = { name: data.name, role: "Promoter" };
  });

  // Fetch all salespersons to build a name map
  const salespersonsSnapshot = await adminDb.collection("salespersons").get();
  salespersonsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    nameMap[doc.id] = { name: data.name, role: "Sales" };
  });

  const stats = {
    totalPending: commissions
      .filter(c => c.status === "pending")
      .reduce((acc, c) => acc + c.commission_amount, 0),
    totalPaid: commissions
      .filter(c => c.status === "paid")
      .reduce((acc, c) => acc + c.commission_amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <FileBox className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Commissions Ledger</h1>
          <p className="text-zinc-400 text-sm mt-1">Review finalized payouts generated automatically upon won leads.</p>
        </div>
      </div>

      <CommissionLedgerClient 
        initialRecords={commissions} 
        nameMap={nameMap}
        stats={stats}
      />
    </div>
  );
}
