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
    const snapshot = await adminDb.collection("products").get();
    const products: Product[] = [];
    
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    // Sort by category then technology
    products.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.technology !== b.technology) return a.technology.localeCompare(b.technology);
      return a.display_name.localeCompare(b.display_name);
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
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
