import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

// PUT /api/admin/franchises/[id]/pricing
// Updates or creates the pricing override for a specific franchise dealer.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // The document ID in franchise_pricing_overrides is usually the same as the dealer ID for a 1:1 mapping,
    // or we query by franchise_dealer_id. Let's find if one exists first.
    const overrideSnap = await adminDb
      .collection("franchise_pricing_overrides")
      .where("franchise_dealer_id", "==", id)
      .limit(1)
      .get();

    if (overrideSnap.empty) {
        // If it doesn't exist, we should use POST to create it, but we can handle it here for convenience
        const docRef = adminDb.collection("franchise_pricing_overrides").doc(id);
        await docRef.set({
             ...body,
             franchise_dealer_id: id,
             created_at: serverTimestamp(),
             updated_at: serverTimestamp()
        });
        return NextResponse.json({ message: "Created pricing override" }, { status: 201 });
    }

    const docId = overrideSnap.docs[0].id;
    
    // Strip id and server fields
    const { id: _id, created_at: _ca, ...updateData } = body;

    await adminDb.collection("franchise_pricing_overrides").doc(docId).update({
      ...updateData,
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ message: "Pricing override updated" });
  } catch (err) {
    console.error("[Franchise Pricing API PUT]", err);
    return NextResponse.json({ error: "Failed to update pricing override" }, { status: 500 });
  }
}

// POST /api/admin/franchises/[id]/pricing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Check if it already exists to avoid duplicates
    const overrideSnap = await adminDb
      .collection("franchise_pricing_overrides")
      .where("franchise_dealer_id", "==", id)
      .limit(1)
      .get();

    if (!overrideSnap.empty) {
        return NextResponse.json({ error: "Pricing override already exists for this dealer. Use PUT to update." }, { status: 409 });
    }

    const docRef = adminDb.collection("franchise_pricing_overrides").doc(id); // Use dealer ID as doc ID for easy lookup
    
    await docRef.set({
      ...body,
      franchise_dealer_id: id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ message: "Pricing override created" }, { status: 201 });
  } catch (err) {
    console.error("[Franchise Pricing API POST]", err);
    return NextResponse.json({ error: "Failed to create pricing override" }, { status: 500 });
  }
}
