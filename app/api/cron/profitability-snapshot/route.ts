import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateDealProfitability, saveProfitabilitySnapshot } from "@/lib/profitability-engine";

/**
 * Triggered nightly by GCP Cloud Scheduler.
 * Secures via OIDC token or a simple secure secret.
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[NIGHTLY CRON] Starting Profitability Snapshot Generation...");
        
        // We look for deals that were modified or had active jobs/invoices in the last 24h.
        // For simplicity in this demo, we'll fetch all non-cancelled deals, or a specific date range.
        
        const period = new Date().toISOString().slice(0, 7); // Current YYYY-MM
        const dealsSnap = await adminDb.collection("deals").get(); // Should be paginated in production
        
        let processed = 0;
        let errors = 0;

        for (const doc of dealsSnap.docs) {
            try {
                const dealId = doc.id;
                const snapshot = await calculateDealProfitability(dealId, period);
                await saveProfitabilitySnapshot(snapshot);
                processed++;
            } catch (err) {
                console.error(`Failed to snapshot deal ${doc.id}`, err);
                errors++;
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            message: `Snapshot Job Completed. Processed: ${processed}, Errors: ${errors}` 
        });

    } catch (error: any) {
        console.error("Cron Error", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
