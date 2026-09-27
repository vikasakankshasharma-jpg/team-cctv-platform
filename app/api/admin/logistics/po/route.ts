import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { CreatePOSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await adminDb.collection("purchase_orders").orderBy("created_at", "desc").get();
    const pos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(pos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const hasOpsPower = session.role === "super_admin" || session.permissions?.operations?.manage_hubs === true;
    
    if (!hasOpsPower) {
      return NextResponse.json({ error: "Forbidden. Requires Operations Power." }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = CreatePOSchema.parse(body);

    const poNumber = `PO-${Date.now().toString().slice(-6)}`; // Cleaner PO number

    const docRef = await adminDb.collection("purchase_orders").add({
      ...validatedData,
      po_number: poNumber,
      status: "issued", // changed from sent to issued
      created_by: session.uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id, po_number: poNumber });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
