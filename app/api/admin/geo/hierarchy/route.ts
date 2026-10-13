import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { getGeoHierarchyData } from "@/lib/geo/geoHierarchyServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const { tree, summary } = await getGeoHierarchyData();

    return NextResponse.json({
      success: true,
      tree,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Geo hierarchy fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load geo hierarchy" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdmin();
    const adminUser = session?.user?.email || session?.user?.uid || "admin";

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    // ACTION 1: Toggle single PINCODE status
    if (action === "toggle_pin") {
      const { pincode, status, name, tehsil, district, state } = body;
      if (!pincode || !status || (status !== "active" && status !== "inactive")) {
        return NextResponse.json({ error: "Invalid pincode or status" }, { status: 400 });
      }

      const docRef = adminDb.collection("geo_pincodes").doc(pincode);
      await docRef.set({
        pincode,
        status,
        ...(name ? { name } : {}),
        ...(tehsil ? { tehsil } : {}),
        ...(district ? { district } : {}),
        ...(state ? { state } : {}),
        updated_at: serverTimestamp(),
        updated_by: adminUser,
      }, { merge: true });

      return NextResponse.json({
        success: true,
        message: `Pincode ${pincode} status updated to ${status}.`,
        pincode,
        status,
      });
    }

    // ACTION 2: Bulk toggle all PINs in a Tehsil
    if (action === "toggle_tehsil") {
      const { pincodes, status, tehsil, district, state } = body;
      if (!Array.isArray(pincodes) || pincodes.length === 0 || !status) {
        return NextResponse.json({ error: "Pincodes array and status are required" }, { status: 400 });
      }

      const batch = adminDb.batch();
      for (const pin of pincodes) {
        const docRef = adminDb.collection("geo_pincodes").doc(pin);
        batch.set(docRef, {
          pincode: pin,
          status,
          ...(tehsil ? { tehsil } : {}),
          ...(district ? { district } : {}),
          ...(state ? { state } : {}),
          updated_at: serverTimestamp(),
          updated_by: adminUser,
        }, { merge: true });
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: `Tehsil ${tehsil || ""} bulk updated: ${pincodes.length} pincodes set to ${status}.`,
        updated_count: pincodes.length,
        status,
      });
    }

    // ACTION 3: Add new Pincode to Tehsil
    if (action === "add_pin") {
      const { pincode, name, state, district, tehsil, status = "inactive" } = body;
      if (!pincode || !/^\d{6}$/.test(pincode) || !state || !district || !tehsil) {
        return NextResponse.json({ error: "Invalid pincode or missing state/district/tehsil" }, { status: 400 });
      }

      const docRef = adminDb.collection("geo_pincodes").doc(pincode);
      await docRef.set({
        pincode,
        name: name || `Pincode ${pincode}`,
        state,
        district,
        tehsil,
        status,
        updated_at: serverTimestamp(),
        updated_by: adminUser,
      }, { merge: true });

      return NextResponse.json({
        success: true,
        message: `Pincode ${pincode} successfully registered in ${tehsil}, ${district}.`,
        pincode,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Geo hierarchy update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update geo hierarchy" },
      { status: 500 }
    );
  }
}
