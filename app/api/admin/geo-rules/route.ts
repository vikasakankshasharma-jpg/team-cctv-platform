import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { CreateGeoPricingRuleSchema } from "@/lib/validators";
import type { GeoPricingRule } from "@/types";

export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await adminDb.collection("geo_pricing_rules").orderBy("priority", "asc").get();
    const rules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    
    const validatedData = CreateGeoPricingRuleSchema.parse(body);

    const docRef = await adminDb.collection("geo_pricing_rules").add({
      ...validatedData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id, ...validatedData });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
