import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Installer } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { InstallersClient } from "@/components/admin/InstallersClient";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Installers | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function InstallersAdminPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("installers").orderBy("created_at", "desc").get();
  
  const installers: Installer[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
    };
  }) as Installer[];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title="Verified Installer Network"
        description="Manage the pincode-mapped independent technicians who execute surveys, installations, and AMCs."
        icon={ShieldCheck}
      />
      
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8">
        <InstallersClient data={installers} />
      </div>
    </div>
  );
}
