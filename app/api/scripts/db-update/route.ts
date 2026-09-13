import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // 1. Update Global Settings
    const settingsRef = adminDb.collection("settings").doc("global");
    await settingsRef.set({
      connector_rj45_cost: 5,
      connector_bnc_dc_cost: 20,
      margin_cable: 50,
    }, { merge: true });

    // 2. Add Cable Products
    const cables = [
      {
        display_name: "Budget Brand CAT6 Cable",
        technical_name: "CAT6 Cable CC Budget",
        brand: "budget",
        category: "cable",
        technologies: ["IP"],
        base_cost: 10.49,
        unit_price: Math.round(10.49 * 1.50), // 16
        is_active: true,
        is_quotation_eligible: true,
        stock_status: "in_stock"
      },
      {
        display_name: "CP Plus CAT6 Cable",
        technical_name: "CAT6 Cable CC CP Plus",
        brand: "cpplus",
        category: "cable",
        technologies: ["IP"],
        base_cost: 12.13,
        unit_price: Math.round(12.13 * 1.50), // 18
        is_active: true,
        is_quotation_eligible: true,
        stock_status: "in_stock"
      },
      {
        display_name: "Budget Brand 3+1 Cable",
        technical_name: "3+1 Coaxial CC Budget",
        brand: "budget",
        category: "cable",
        technologies: ["HD"],
        base_cost: 8.57,
        unit_price: Math.round(8.57 * 1.50), // 13
        is_active: true,
        is_quotation_eligible: true,
        stock_status: "in_stock"
      },
      {
        display_name: "CP Plus 3+1 Cable",
        technical_name: "3+1 Coaxial CP Plus",
        brand: "cpplus",
        category: "cable",
        technologies: ["HD"],
        base_cost: 15,
        unit_price: Math.round(15 * 1.50), // 23
        is_active: true,
        is_quotation_eligible: true,
        stock_status: "in_stock"
      }
    ];

    const productsRef = adminDb.collection("products");
    
    // Quick check if they exist
    const existing = await productsRef.where("category", "==", "cable").get();
    if (existing.empty) {
      for (const c of cables) {
        await productsRef.add(c);
      }
    } else {
      // Just update margins/prices for existing cables if they match our script?
      // For simplicity, we just add if empty.
    }

    return NextResponse.json({ success: true, message: "Settings and cables updated" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
