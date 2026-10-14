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

    // ACTION 4: Import entire District & Tehsils (or new State)
    if (action === "import_district") {
      const { state, district, pins } = body;
      if (!state || !district || !Array.isArray(pins) || pins.length === 0) {
        return NextResponse.json({ error: "State, district, and pins array are required" }, { status: 400 });
      }

      // Batch write in chunks of 400 to respect Firestore 500 limit
      for (let i = 0; i < pins.length; i += 400) {
        const chunk = pins.slice(i, i + 400);
        const batch = adminDb.batch();
        for (const p of chunk) {
          if (!p.pincode || !/^\d{6}$/.test(p.pincode)) continue;
          const docRef = adminDb.collection("geo_pincodes").doc(p.pincode);
          batch.set(docRef, {
            pincode: p.pincode,
            name: p.name || `Pincode ${p.pincode}`,
            tehsil: p.tehsil || `${district} Central`,
            district,
            state,
            status: p.status || "inactive",
            updated_at: serverTimestamp(),
            updated_by: adminUser,
          }, { merge: true });
        }
        await batch.commit();
      }

      return NextResponse.json({
        success: true,
        message: `District ${district}, ${state} imported successfully with ${pins.length} PINs.`,
        imported_count: pins.length,
      });
    }

    // ACTION 5: Delete District from hierarchy
    if (action === "delete_district") {
      const { state, district } = body;
      if (!state || !district) {
        return NextResponse.json({ error: "State and district are required" }, { status: 400 });
      }

      const snap = await adminDb.collection("geo_pincodes")
        .where("state", "==", state)
        .where("district", "==", district)
        .get();

      if (snap.size > 0) {
        const batch = adminDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      return NextResponse.json({
        success: true,
        message: `District ${district}, ${state} removed (${snap.size} custom PINs deleted).`,
        deleted_count: snap.size,
      });
    }

    // ACTION 6: Delete State from hierarchy
    if (action === "delete_state") {
      const { state } = body;
      if (!state) {
        return NextResponse.json({ error: "State is required" }, { status: 400 });
      }

      const snap = await adminDb.collection("geo_pincodes")
        .where("state", "==", state)
        .get();

      if (snap.size > 0) {
        const batch = adminDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      return NextResponse.json({
        success: true,
        message: `State ${state} removed (${snap.size} custom PINs deleted).`,
        deleted_count: snap.size,
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
