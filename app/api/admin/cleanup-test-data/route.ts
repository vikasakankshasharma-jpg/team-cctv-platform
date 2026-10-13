import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const deletedCounts = {
      quotes: 0,
      leads: 0,
      invoices: 0,
      jobs: 0,
    };

    // 1. Find and purge test quotes
    const quotesSnap = await adminDb.collection("quotes").get();
    const batch = adminDb.batch();
    let batchCount = 0;

    for (const doc of quotesSnap.docs) {
      const qId = doc.id;
      const data = doc.data();
      const isTest = 
        qId.startsWith("QT-E2E-") ||
        qId.startsWith("TEST-") ||
        data.is_test === true ||
        data.customer_mobile === "9999999999" ||
        (data.customer_name || "").toLowerCase().includes("test user") ||
        (data.customer_name || "").toLowerCase().includes("e2e test");

      if (isTest) {
        batch.delete(doc.ref);
        deletedCounts.quotes++;
        batchCount++;
      }
    }

    // 2. Find and purge test leads
    const leadsSnap = await adminDb.collection("leads").get();
    for (const doc of leadsSnap.docs) {
      const lId = doc.id;
      const data = doc.data();
      const isTest =
        lId.startsWith("TEST-") ||
        lId.startsWith("L_REV_") ||
        data.is_test === true ||
        data.mobile_number === "9999999999" ||
        (data.customer_name || "").toLowerCase().includes("test user") ||
        (data.customer_name || "").toLowerCase().includes("e2e test") ||
        (data.customer_name || "").toLowerCase().includes("e2e lifecycle tester");

      if (isTest) {
        batch.delete(doc.ref);
        deletedCounts.leads++;
        batchCount++;
      }
    }

    // 3. Find and purge test invoices & jobs
    const invoicesSnap = await adminDb.collection("invoices").get();
    for (const doc of invoicesSnap.docs) {
      const data = doc.data();
      const isTest =
        doc.id.startsWith("INV-TEST-") ||
        data.is_test === true ||
        (data.quote_id && data.quote_id.startsWith("QT-E2E-"));

      if (isTest) {
        batch.delete(doc.ref);
        deletedCounts.invoices++;
        batchCount++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCounts.quotes} test quotes, ${deletedCounts.leads} test leads, and ${deletedCounts.invoices} test invoices.`,
      deletedCounts,
    });
  } catch (error: any) {
    console.error("[Cleanup Test Data Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cleanup test data" },
      { status: 500 }
    );
  }
}
