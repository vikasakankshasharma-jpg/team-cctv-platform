import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { CreateInstallerSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await adminDb.collection("installers").orderBy("created_at", "desc").get();
    const installers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(installers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    
    const validatedData = CreateInstallerSchema.parse(body);

    const docRef = await adminDb.collection("installers").add({
      ...validatedData,
      kyc_status: "pending",
      is_active: true,
      sla_score: 100,
      avg_rating: 5.0,
      jobs_completed: 0,
      sla_breaches: 0,
      wallet_balance: 0,
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
