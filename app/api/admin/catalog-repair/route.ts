import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

/**
 * POST /api/admin/catalog-repair
 * 
 * One-time batch script to assign `catalog_path` to all products in Firestore
 * that currently lack the field.
 * 
 * Path logic:
 *   camera  + HD  + 2MP  → CCTV/Camera/HD/2MP
 *   camera  + HD  + 5MP  → CCTV/Camera/HD/5MP
 *   camera  + IP  + 2MP  → CCTV/Camera/IP/2MP
 *   camera  + IP  + 4MP  → CCTV/Camera/IP/4MP
 *   camera  + IP  + 5MP  → CCTV/Camera/IP/5MP
 *   camera  + IP  + 8MP  → CCTV/Camera/IP/8MP
 *   recorder + HD         → CCTV/Recorder/HD/DVR
 *   recorder + IP         → CCTV/Recorder/IP/NVR
 *   accessory             → CCTV/Accessory/both/General
 *   cable                 → CCTV/Cable/HD/Coaxial
 *   network               → CCTV/Network/IP/Switch
 *   display               → CCTV/Display/both/General
 *   storage               → CCTV/Storage/both/HDD
 */

function deriveCatalogPath(data: any): string {
  const category = (data.category || "").toLowerCase();
  const technology = (data.technology || "both").toUpperCase();
  
  // Resolution detection — from resolution_mp, technical tags, or display name
  function detectResolution(): string {
    if (data.resolution_mp) return `${data.resolution_mp}MP`;
    // Check technical_name / display_name for MP hints
    const name = `${data.display_name || ""} ${data.technical_name || ""}`.toLowerCase();
    if (name.includes("8mp") || name.includes("4k")) return "8MP";
    if (name.includes("5mp")) return "5MP";
    if (name.includes("4mp")) return "4MP";
    if (name.includes("2mp") || name.includes("2.4mp")) return "2MP";
    if (name.includes("1mp") || name.includes("720p")) return "1MP";
    return "General";
  }

  // Channel detection for recorders
  function detectChannels(): string {
    if (data.channels) return `${data.channels}ch`;
    const name = `${data.display_name || ""}`.toLowerCase();
    if (name.includes("32 ch") || name.includes("32ch")) return "32ch";
    if (name.includes("16 ch") || name.includes("16ch")) return "16ch";
    if (name.includes("8 ch") || name.includes("8ch")) return "8ch";
    if (name.includes("4 ch") || name.includes("4ch")) return "4ch";
    return "General";
  }

  switch (category) {
    case "camera":
      return `CCTV/Camera/${technology}/${detectResolution()}`;
    
    case "recorder":
      return `CCTV/Recorder/${technology}/${detectChannels()}`;
    
    case "accessory":
      return `CCTV/Accessory/both/General`;
    
    case "cable":
      if (technology === "IP") return "CCTV/Cable/IP/CAT6";
      return "CCTV/Cable/HD/Coaxial";
    
    case "network":
      return "CCTV/Network/IP/Switch";
    
    case "display":
      return "CCTV/Display/both/General";
    
    case "storage":
    case "hdd":
      return "CCTV/Storage/both/HDD";
    
    case "power":
      return "CCTV/Power/both/General";
    
    default:
      return `CCTV/${category || "Other"}/both/General`;
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("products").get();
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const pathDistribution: Record<string, number> = {};

    // Process in batches of 400 (Firestore batch limit is 500)
    const BATCH_SIZE = 400;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);
      let batchHasWrites = false;

      for (const doc of chunk) {
        const data = doc.data();
        
        // Only update if catalog_path is missing or empty
        if (!data.catalog_path) {
          try {
            const path = deriveCatalogPath(data);
            batch.update(doc.ref, { catalog_path: path, updated_at: new Date() });
            pathDistribution[path] = (pathDistribution[path] || 0) + 1;
            updated++;
            batchHasWrites = true;
          } catch (e) {
            errors++;
          }
        } else {
          skipped++;
        }
      }

      if (batchHasWrites) {
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_documents: docs.length,
        updated,
        skipped_already_had_path: skipped,
        errors,
      },
      path_distribution: pathDistribution,
    });

  } catch (error) {
    console.error("[catalog-repair] Failed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
