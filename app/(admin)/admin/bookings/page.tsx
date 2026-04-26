import { adminDb } from "@/lib/firebase-admin";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { BookingsClient } from "@/components/admin/BookingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site Visits | Operational Hub",
  description: "Schedule and manage technician site visits for pinpoint location verification.",
};

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const snapshot = await adminDb.collection("site_visit_bookings")
    .orderBy("created_at", "desc")
    .limit(50)
    .get();

  const bookings = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
      site_visit_date: data.site_visit_date?.toDate?.()?.toISOString() || data.site_visit_date || null,
    };
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        icon={Calendar} 
        title="Site Visits" 
        description="Schedule and manage technician site visits for pinpoint location verification."
      />
      
      <BookingsClient initialBookings={bookings as unknown[]} />
    </div>
  );
}
