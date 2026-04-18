import { adminDb } from "@/lib/firebase-admin";
import { FileBox } from "lucide-react";
import type { CommissionRecord, Promoter } from "@/types";
import { CommissionLedgerClient } from "@/components/admin/CommissionLedgerClient";
import { COLLECTIONS } from "@/lib/firebase-client";

export const dynamic = "force-dynamic";

export default async function CommissionAdminPage() {
  // Fetch commission records
  const snapshot = await adminDb.collection(COLLECTIONS.COMMISSION_RECORDS)
    .orderBy("created_at", "desc")
    .limit(200)
    .get();
  
  const commissions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<CommissionRecord, "id">)
  })) as CommissionRecord[];

  // Fetch all promoters to build a name map for readability
  const promotersSnapshot = await adminDb.collection(COLLECTIONS.PROMOTERS).get();
  const promoterMap: Record<string, string> = {};
  promotersSnapshot.docs.forEach(doc => {
    const data = doc.data() as Promoter;
    promoterMap[doc.id] = data.name;
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
        promoterMap={promoterMap}
        stats={stats}
      />
    </div>
  );
}
