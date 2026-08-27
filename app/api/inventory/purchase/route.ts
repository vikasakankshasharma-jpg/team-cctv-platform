import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection("purchase_orders").orderBy("createdAt", "desc").get();
    const pos = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, data: pos });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const poId = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newPO = {
      id: poId,
      supplierName: body.supplierName,
      status: "DRAFT",
      items: body.items || [],
      createdAt: new Date().toISOString(),
      expectedDeliveryDate: body.expectedDeliveryDate || null
    };
    
    await adminDb.collection("purchase_orders").doc(poId).set(newPO);
    
    return NextResponse.json({ success: true, poId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
