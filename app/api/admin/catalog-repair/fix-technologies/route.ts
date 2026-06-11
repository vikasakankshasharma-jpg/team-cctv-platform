import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

/**
 * POST /api/admin/catalog-repair/fix-technologies
 * 
 * One-time migration script to:
 * 1. Replace "Analog" with "HD" in technologies arrays
 * 2. Ensure all active products have is_deleted: false
 */
export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("products").get();
    
    let techFixed = 0;
    let deletedFieldFixed = 0;
    let totalDocs = snapshot.docs.length;

    const BATCH_SIZE = 400;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);
      let batchHasWrites = false;

      for (const doc of chunk) {
        const data = doc.data();
        const updates: Record<string, any> = {};

        // Fix 1: Replace "Analog" with "HD" in technologies array
        if (Array.isArray(data.technologies)) {
          const hasAnalog = data.technologies.includes("Analog");
          if (hasAnalog) {
            const fixed = data.technologies.map((t: string) => t === "Analog" ? "HD" : t);
            // Deduplicate in case both "Analog" and "HD" existed
            updates.technologies = [...new Set(fixed)];
            techFixed++;
          }
        }

        // Fix 2: Add is_deleted: false if missing
        if (data.is_deleted === undefined || data.is_deleted === null) {
          updates.is_deleted = false;
          deletedFieldFixed++;
        }

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          batch.update(doc.ref, updates);
          batchHasWrites = true;
        }
      }

      if (batchHasWrites) {
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_documents: totalDocs,
        technologies_fixed_analog_to_hd: techFixed,
        is_deleted_field_added: deletedFieldFixed,
      }
    });

  } catch (error) {
    console.error("[fix-technologies] Failed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
