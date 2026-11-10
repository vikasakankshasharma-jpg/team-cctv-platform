import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Job, Hub, Installer } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { DispatchClient } from "@/components/admin/DispatchClient";
import { OperationsSubNav } from "@/components/admin/navigation/AdminSubNav";
import { Workflow } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispatch Center | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  await requireAdmin();

  let jobs: Job[] = [];
  let hubs: Hub[] = [];
  let installers: Installer[] = [];

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

  try {
    const [jobsSnap, hubsSnap, installersSnap] = await Promise.all([
      adminDb.collection("jobs").orderBy("created_at", "desc").limit(50).get(),
      adminDb.collection("hubs").where("is_active", "==", true).get(),
      adminDb.collection("installers").where("is_active", "==", true).get()
    ]);

    jobs = jobsSnap.docs.map(serializeDoc) as Job[];
    hubs = hubsSnap.docs.map(serializeDoc) as Hub[];
    installers = installersSnap.docs.map(serializeDoc) as Installer[];
  } catch (err) {
    console.warn("⚠️ Failed to load dispatch data from Firestore, using baseline state:", err);
    hubs = [
      {
        id: "hub_jaipur_central",
        name: "Jaipur Central Hub",
        city: "Jaipur",
        address: "MI Road, Jaipur, Rajasthan",
        pincodes: ["302001", "302002", "302003", "302004", "302015"],
        is_active: true,
      } as any,
    ];
    installers = [
      {
        id: "inst_1",
        full_name: "Ramesh Sharma",
        phone: "+91 98290 11223",
        status: "available",
        assigned_pincodes: ["302001", "302002"],
        rating: 4.9,
        is_active: true,
      } as any,
    ];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 h-[calc(100vh-6rem)] flex flex-col">
      <OperationsSubNav />
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
