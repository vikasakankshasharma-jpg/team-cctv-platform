import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { SupportPanel } from "@/components/customer/SupportPanel";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Support | TEAM CCTV",
  description: "Raise a support ticket, view warranty information, and get help.",
};

export const dynamic = "force-dynamic";

export default async function CustomerSupportPage() {
  const session = await verifySession();

  if (!session.isAuthenticated) {
    redirect("/customer/login?redirect=/customer/support");
  }

  const uid = session.user?.uid || session.uid || "";
  let phoneNumber = session.user?.phone_number;

  if (!phoneNumber && uid) {
    try {
      const userRecord = await adminAuth.getUser(uid);
      phoneNumber = userRecord.phoneNumber;
    } catch (e) {
      console.warn("[CustomerSupport] Could not fetch user record:", e);
    }
  }

  const rawMobile = phoneNumber ? String(phoneNumber).replace(/\D/g, "").slice(-10) : "";
  
  let customerName = session.user?.name || "Valued Client";
  let customerPhone = rawMobile;
  const warranties: any[] = [];
  const activeTickets: any[] = [];

  try {
    // Fetch leads to get customer info
    const leadsSnap = rawMobile 
      ? await adminDb.collection("leads").where("mobile_number", "==", rawMobile).limit(5).get()
      : await adminDb.collection("leads").where("firebase_uid", "==", uid).limit(5).get();
    
    if (!leadsSnap.empty) {
      const firstLead = leadsSnap.docs[0].data();
      customerName = firstLead.customer_name || firstLead.name || customerName;
    }

    // Fetch warranty certificates linked to this customer
    const warrantyPromises: Promise<void>[] = [];

    if (uid) {
      warrantyPromises.push(
        adminDb.collection("warranties").where("firebase_uid", "==", uid).get()
          .then(snap => snap.docs.forEach(d => warranties.push({ id: d.id, ...d.data() })))
          .catch(() => {})
      );
    }
    if (rawMobile) {
      warrantyPromises.push(
        adminDb.collection("warranties").where("customer_phone", "==", rawMobile).get()
          .then(snap => {
            snap.docs.forEach(d => {
              if (!warranties.find(w => w.id === d.id)) {
                warranties.push({ id: d.id, ...d.data() });
              }
            });
          })
          .catch(() => {})
      );
    }

    await Promise.all(warrantyPromises);

    // Fetch active tickets
    if (rawMobile) {
      const ticketsSnap = await adminDb.collection("support_tickets")
        .where("customer_phone", "==", rawMobile)
        .orderBy("created_at", "desc")
        .limit(10)
        .get()
        .catch(() => null);
      
      if (ticketsSnap) {
        ticketsSnap.docs.forEach(d => {
          const data = d.data();
          activeTickets.push({
            id: d.id,
            ...data,
            created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
          });
        });
      }
    }
  } catch (err) {
    console.error("[CustomerSupport] Error fetching data:", err);
  }

  // Serialize for client
  const customerInfo = JSON.parse(JSON.stringify({
    id: uid,
    name: customerName,
    phone: customerPhone,
  }));

  const safeWarranties = JSON.parse(JSON.stringify(warranties, (key, value) => {
    if (value && typeof value === "object" && typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (value && typeof value === "object" && "_seconds" in value) {
      return new Date(value._seconds * 1000).toISOString();
    }
    return value;
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link 
          href="/customer/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <SupportPanel 
          customerInfo={customerInfo} 
          warranties={safeWarranties} 
          activeTickets={activeTickets} 
        />
      </div>
    </div>
  );
}
