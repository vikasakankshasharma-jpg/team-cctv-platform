import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { SupportTicketsClient } from "@/components/admin/support/SupportTicketsClient";
import { CrmSubNav } from "@/components/admin/navigation/AdminSubNav";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireAdmin();

  let tickets: any[] = [];
  let installers: any[] = [];

  try {
    const ticketsSnap = await adminDb.collection("support_tickets").orderBy("created_at", "desc").limit(50).get();
    tickets = ticketsSnap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });

    const installersSnap = await adminDb.collection("installers").where("is_active", "==", true).limit(50).get();
    installers = installersSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name || d.data().full_name || "Technician",
      phone: d.data().mobile_number || d.data().phone || ""
    }));
  } catch (err) {
    console.warn("⚠️ Failed to load support tickets from Firestore:", err);
  }

  return (
    <div className="space-y-6">
      <CrmSubNav />
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Support & Warranty Desk</h1>
        <p className="text-zinc-500 font-medium text-xs mt-0.5">Manage AMC visits, repair tickets, and installer dispatch.</p>
      </div>

      <SupportTicketsClient initialTickets={tickets} availableInstallers={installers} />
    </div>
  );
}
