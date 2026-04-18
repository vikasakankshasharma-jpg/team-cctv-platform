import { adminDb } from "@/lib/firebase-admin";
import type { Addon } from "@/types";
import { AddonsClient } from "@/components/admin/AddonsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add-ons & Options | Command Centre",
  description: "Configure system enhancers, storage expansions, and installation logic rules.",
};

export const dynamic = "force-dynamic";

export default async function AddonsAdminPage() {
  const snapshot = await adminDb.collection("addons").where("is_deleted", "==", false).get();
  
  const addons = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Addon, "id">)
  }));

  // Sort by name
  addons.sort((a, b) => a.display_name.localeCompare(b.display_name));

  return (
    <div className="space-y-6">
      <AddonsClient initialAddons={addons} />
    </div>
  );
}
