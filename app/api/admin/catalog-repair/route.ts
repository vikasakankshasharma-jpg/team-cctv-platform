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
  
  // Resolution detection
  function detectResolution(): string {
    if (data.resolution_mp) return `${data.resolution_mp}MP`;
    const name = `${data.display_name || ""} ${data.technical_name || ""}`.toLowerCase();
    if (name.includes("8mp") || name.includes("4k")) return "8MP";
    if (name.includes("6mp")) return "6MP";
    if (name.includes("5mp")) return "5MP";
    if (name.includes("4mp")) return "4MP";
    if (name.includes("2.4mp") || name.includes("2mp")) return "2MP";
    if (name.includes("1mp") || name.includes("720p")) return "1MP";
    return "General";
  }

  // Channel detection
  function detectChannels(): string {
    if (data.channels) return `${data.channels}ch`;
    if (data.max_cameras) return `${data.max_cameras}ch`;
    const name = `${data.display_name || ""}`.toLowerCase();
    if (name.includes("32 ch") || name.includes("32ch")) return "32ch";
    if (name.includes("16 ch") || name.includes("16ch")) return "16ch";
    if (name.includes("8 ch") || name.includes("8ch")) return "8ch";
    if (name.includes("4 ch") || name.includes("4ch")) return "4ch";
    return "General";
  }
  
  // Storage detection
  function detectStorage(): string {
    const name = `${data.display_name || ""}`.toLowerCase();
    const tbMatch = name.match(/(\d+)\s*tb/);
    if (tbMatch) return `${tbMatch[1]}TB`;
    const gbMatch = name.match(/(\d+)\s*gb/);
    if (gbMatch) return `${gbMatch[1]}GB`;
    return "General";
  }

  switch (category) {
    case "camera":
    case "cctv_camera":
    case "camera_hd":
    case "camera_ip":
      return `CCTV/Camera/${technology}/${detectResolution()}`;
    
    case "recorder":
      return `CCTV/Recorder/${technology}/${detectChannels()}`;
    
    case "accessory":
    case "accessories":
      return `CCTV/Accessory/both/General`;
    
    case "cable":
      if (technology === "IP" || data.display_name?.toLowerCase().includes("cat6")) return "CCTV/Cable/IP/CAT6";
      return "CCTV/Cable/HD/Coaxial";
    
    case "network":
      return "CCTV/Network/IP/Switch";
    
    case "display":
      return "CCTV/Display/both/General";
    
    case "storage":
    case "hdd":
      return `CCTV/Storage/both/${detectStorage()}`;
    
    case "power":
    case "power_device":
      return `CCTV/Power/both/${detectChannels()}`;
      
    case "connector":
      return `CCTV/Connector/both/General`;
      
    case "labor":
    case "installation":
    case "labor_install":
      return `CCTV/Labor/both/General`;
    
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
        
        // Always update to enforce correct hierarchical paths and critical flags
        try {
          const path = deriveCatalogPath(data);
          const updates: Record<string, any> = {};
          if (data.catalog_path !== path) {
            updates.catalog_path = path;
            pathDistribution[path] = (pathDistribution[path] || 0) + 1;
          }
          if (data.is_deleted === undefined || data.is_deleted === null) {
            updates.is_deleted = false;
          }
          if (data.is_quotation_eligible === undefined) {
            updates.is_quotation_eligible = true;
          }

          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date();
            batch.update(doc.ref, updates);
            updated++;
            batchHasWrites = true;
          } else {
            skipped++;
          }
        } catch (e) {
          errors++;
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
