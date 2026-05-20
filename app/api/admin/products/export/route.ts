import { verifySession } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import Papa from "papaparse";
import type { Product } from "@/types";

// Columns to include in the exported CSV (in order)
const CSV_COLUMNS: (keyof Product)[] = [
  "id",
  "technical_name",
  "display_name",
  "category",
  "technology",
  "brand",
  "base_cost",
  "margin_percentage",
  "unit_price",
  "unit_price_budget",
  "unit_price_premium",
  "resolution_mp",
  "channels",
  "max_cameras",
  "min_cameras",
  "catalog_path",
  "is_active",
  "image_url",
];

/**
 * GET /api/admin/products/export
 * Query Params (all optional for filtering):
 *   category   = camera | recorder | accessory | cable | network
 *   technology = HD | IP | Common | WiFi | 4G
 *   is_active  = true | false
 *
 * Returns a CSV file download.
 */
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const technology = searchParams.get("technology");
    const is_active = searchParams.get("is_active");

    // Build Firestore query with optional filters
    let query: FirebaseFirestore.Query = adminDb.collection("products");
    if (category) query = query.where("category", "==", category);
    if (technology) query = query.where("technology", "==", technology);
    if (is_active !== null) query = query.where("is_active", "==", is_active === "true");

    const snap = await query.get();

    const rows: Record<string, unknown>[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as Product;
      const row: Record<string, unknown> = { id: doc.id };
      // Only output designated columns
      for (const col of CSV_COLUMNS) {
        if (col === "id") continue; // already added
        const val = data[col];
        row[col] = val !== undefined && val !== null ? val : "";
      }
      rows.push(row);
    });

    // Sort by category, then display_name for consistent output
    rows.sort((a, b) => {
      const catCmp = String(a.category ?? "").localeCompare(String(b.category ?? ""));
      if (catCmp !== 0) return catCmp;
      return String(a.display_name ?? "").localeCompare(String(b.display_name ?? ""));
    });

    const csv = Papa.unparse(rows, {
      columns: CSV_COLUMNS as string[],
      header: true,
    });

    // Build filename with applied filter info
    const filterTag = [category, technology].filter(Boolean).join("_") || "all";
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `products_${filterTag}_${dateTag}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  }
}
