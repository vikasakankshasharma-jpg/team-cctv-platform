import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Job, Hub, Installer } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { DispatchClient } from "@/components/admin/DispatchClient";
import { Workflow } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispatch Center | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  await requireAdmin();

  // Fetch jobs, hubs, and installers for the dispatch board
  const [jobsSnap, hubsSnap, installersSnap] = await Promise.all([
    adminDb.collection("jobs").orderBy("created_at", "desc").limit(50).get(),
    adminDb.collection("hubs").where("is_active", "==", true).get(),
    adminDb.collection("installers").where("is_active", "==", true).get()
  ]);

  const serializeDoc = (doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
      scheduled_at: data.scheduled_at?.toDate?.()?.toISOString() || data.scheduled_at || null,
      sla_breach_at: data.sla_breach_at?.toDate?.()?.toISOString() || data.sla_breach_at || null,
      last_active: data.last_active?.toDate?.()?.toISOString() || data.last_active || null,
    };
  };

  const jobs = jobsSnap.docs.map(serializeDoc) as Job[];
  const hubs = hubsSnap.docs.map(serializeDoc) as Hub[];
  const installers = installersSnap.docs.map(serializeDoc) as Installer[];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 h-[calc(100vh-6rem)] flex flex-col">
      <PageHeader
        title="Dispatch & Operations Center"
        description="Live tracking, SLA routing, and strict state machine management for all surveys, installations, and AMCs."
        icon={Workflow}
      />
      
      <div className="flex-1 min-h-0 bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl p-6 flex flex-col">
        <DispatchClient jobs={jobs} hubs={hubs} installers={installers} />
      </div>
    </div>
  );
}
