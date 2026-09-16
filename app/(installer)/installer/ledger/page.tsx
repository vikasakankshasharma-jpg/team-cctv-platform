import { redirect } from "next/navigation";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { LedgerTransaction, Installer, OfflinePaymentVerification } from "@/types";
import { LedgerClient } from "./LedgerClient";

export const dynamic = "force-dynamic";

export default async function InstallerLedgerPage() {
  const session = await verifyInstallerSession();
  if (!session.isAuthenticated) redirect("/installer/login");
  const installerId = session.installerId!;

  // 1. Fetch Installer Wallet Balance & Details
  const installerDoc = await adminDb.collection(COLLECTIONS.INSTALLERS).doc(installerId).get();
  const installerData = { id: installerDoc.id, ...installerDoc.data() } as Installer;
  const balance = installerData?.wallet_balance || 0;

  // 2. Fetch Ledger Transactions
  const ledgerSnap = await adminDb
    .collection(COLLECTIONS.LEDGER_TRANSACTIONS)
    .where("user_id", "==", installerId)
    .orderBy("created_at", "desc")
    .limit(50)
    .get();

  const transactions: LedgerTransaction[] = [];
  ledgerSnap.docs.forEach((doc) => {
    // Need to serialize timestamps for Client Component
    const data = doc.data();
    transactions.push({ 
      id: doc.id, 
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at
    } as any);
  });


  // 3. Fetch Pending/Offline Verifications
  const offlineSnap = await adminDb
    .collection("offline_verifications")
    .where("installer_id", "==", installerId)
    .orderBy("created_at", "desc")
    .limit(50)
    .get();

  const offlineVerifications: OfflinePaymentVerification[] = [];
  offlineSnap.docs.forEach((doc) => {
    const data = doc.data();
    offlineVerifications.push({
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
      resolved_at: data.resolved_at?.toDate ? data.resolved_at.toDate().toISOString() : data.resolved_at,
    } as any);
  });

  return (
    <LedgerClient 
      installer={installerData} 
      balance={balance} 
      transactions={transactions} 
      offlineVerifications={offlineVerifications}
    />
  );
}
