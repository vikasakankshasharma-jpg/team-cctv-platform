import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { PayoutsClient } from "./PayoutsClient";
import type { PayoutRequest } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const session = await verifySession();
  if (!session.isAuthenticated) redirect("/admin/login");

  const snap = await adminDb
    .collection("payout_requests")
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const requests: PayoutRequest[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
      updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at,
    } as any;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Payout Requests
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage and approve installer payout requests.
        </p>
      </div>

      <PayoutsClient initialRequests={requests} />
    </div>
  );
}
