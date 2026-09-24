import { adminDb } from "@/lib/firebase-admin";
import { SupportTicketsClient } from "@/components/admin/support/SupportTicketsClient";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  // Fetch active tickets
  const ticketsSnap = await adminDb.collection("support_tickets").orderBy("created_at", "desc").get();
  const tickets = ticketsSnap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString()
    };
  });

  // Fetch available installers for dispatching
  const installersSnap = await adminDb.collection("installers").where("is_active", "==", true).get();
  const installers = installersSnap.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    phone: d.data().mobile_number || d.data().phone
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Support & Warranty Desk</h1>
        <p className="text-gray-500 font-medium">Manage AMC visits, repair tickets, and installer dispatch.</p>
      </div>

      <SupportTicketsClient initialTickets={tickets} availableInstallers={installers} />
    </div>
  );
}
