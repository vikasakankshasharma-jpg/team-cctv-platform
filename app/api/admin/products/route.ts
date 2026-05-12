import { verifySession } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Product } from "@/types";

/**
 * GET: Fetch all products for the admin dashboard.
 */
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  try {
    const [prodSnap, addonSnap] = await Promise.all([
      adminDb.collection("products").get(),
      adminDb.collection("addons").get()
    ]);

    const items: Product[] = [];
    
    prodSnap.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as Product);
    });

    addonSnap.forEach(doc => {
      const data = doc.data();
      // Map Addon to Product-like structure for the dashboard
      items.push({ 
        id: doc.id, 
        ...data,
        unit_price: data.price || data.unit_price || 0,
        category: data.category || "accessory", // Default to accessory if not set
        technology: data.technology || "both"
      } as any as Product);
    });

    // Sort by category then name
    items.sort((a, b) => {
      const catA = a.category || "";
      const catB = b.category || "";
      if (catA !== catB) return catA.localeCompare(catB);
      return a.display_name.localeCompare(b.display_name);
    });

    return NextResponse.json({ success: true, products: items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
  }
}

/**
 * POST: Create a new product.
 */
export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  try {
    const body = await req.json();
    const product: Product = {
      ...body,
      is_active: body.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Calculate unit_price if base_cost and margin_percentage exist
    if (product.base_cost !== undefined && product.margin_percentage !== undefined) {
      const calculatedPrice = product.base_cost + (product.base_cost * (product.margin_percentage / 100));
      product.unit_price = Math.round(calculatedPrice); // Round to nearest rupee
    }

    let docRef;
    if (product.id) {
      // If client provided an ID (e.g., technical_name), use it
      docRef = adminDb.collection("products").doc(product.id);
      const docId = product.id;
      delete product.id; // Don't store id inside the document fields
      await docRef.set(product);
      product.id = docId;
    } else {
      docRef = await adminDb.collection("products").add(product);
      product.id = docRef.id;
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

/**
 * PATCH: Update an existing product.
 */
export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Re-calculate unit_price if cost/margin is updated
    if (updates.base_cost !== undefined || updates.margin_percentage !== undefined) {
      // We might only be receiving partial updates, so we should fetch the current state to be safe,
      // but assuming the client sends all necessary fields for calculation:
      const cost = updates.base_cost;
      const margin = updates.margin_percentage;
      if (cost !== undefined && margin !== undefined) {
         updates.unit_price = Math.round(cost + (cost * (margin / 100)));
      }
    }

    updates.updated_at = new Date();

    const docRef = adminDb.collection("products").doc(id);
    await docRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}
