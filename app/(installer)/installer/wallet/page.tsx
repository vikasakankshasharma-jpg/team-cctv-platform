import { redirect } from "next/navigation";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { LedgerTransaction, Installer } from "@/types";
import { WalletClient } from "./WalletClient";

export const dynamic = "force-dynamic";

export default async function InstallerWalletPage() {
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

  return (
    <WalletClient 
      installer={installerData} 
      balance={balance} 
      transactions={transactions} 
    />
  );
}
