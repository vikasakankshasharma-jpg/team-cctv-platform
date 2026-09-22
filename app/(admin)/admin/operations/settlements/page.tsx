import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import SettlementsClient from "./SettlementsClient";

export const dynamic = "force-dynamic";

export default async function SettlementsPage() {
  await requireAdmin();

  const snap = await adminDb
    .collection("offline_verifications")
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const verifications = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
      resolved_at: data.resolved_at?.toDate ? data.resolved_at.toDate().toISOString() : data.resolved_at,
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Field Settlements Ledger</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Verify and approve offline payments (Cash & UPI) collected by installers in the field.
        </p>
      </div>
      <SettlementsClient initialData={verifications as any[]} />
    </div>
  );
}
