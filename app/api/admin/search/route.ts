import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase().trim() || "";

    if (q.length < 2) {
      return NextResponse.json({ success: true, data: { leads: [], franchises: [], products: [] } });
    }

    // Parallel searches for maximum performance
    const [leadsSnap, franchiseSnap] = await Promise.all([
      adminDb.collection("leads")
        .orderBy("customer_name")
        .startAt(q)
        .endAt(q + "\uf8ff")
        .limit(5)
        .get(),
      adminDb.collection("franchise_dealers")
        .orderBy("company_name")
        .startAt(q.toUpperCase()) // Franchises often capitalized
        .endAt(q.toUpperCase() + "\uf8ff")
        .limit(5)
        .get()
    ]);

    // Fallback for case-insensitive mobile search if q is numeric
    let mobileLeads: any[] = [];
    if (/^\d+$/.test(q)) {
      const mSnap = await adminDb.collection("leads")
        .where("mobile_number", ">=", q)
        .where("mobile_number", "<=", q + "\uf8ff")
        .limit(5)
        .get();
      mobileLeads = mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    const leads = [
      ...leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...mobileLeads
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Deduplicate

    const franchises = franchiseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      success: true,
      data: {
        leads,
        franchises,
        products: [] // Future expansion
      }
    });

  } catch (error) {
    console.error("OmniSearch API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
